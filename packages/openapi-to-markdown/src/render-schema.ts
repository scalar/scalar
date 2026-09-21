import { getResolvedRef, mergeSiblingReferences } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type { MaybeRefSchemaObject, SchemaObject } from '@scalar/workspace-store/schemas/v3.2/strict/schema'
import type { ListItem, PhrasingContent, RootContent } from 'mdast'

import { inlineCode, item, list, paragraph, strong, text } from './markdown-nodes'

/** Boolean schemas must survive rendering without being coerced into empty objects. */
type MarkdownSchema = MaybeRefSchemaObject | boolean

type SchemaView = {
  schema: SchemaObject | boolean
  title?: string
  description?: string
  type?: string | string[]
  format?: string
  enum?: unknown[]
  const?: unknown
  default?: unknown
  readOnly?: boolean
  writeOnly?: boolean
  allOf?: MarkdownSchema[]
  anyOf?: MarkdownSchema[]
  oneOf?: MarkdownSchema[]
  not?: MarkdownSchema
  properties: [string, MarkdownSchema][]
  required: ReadonlySet<string>
  items?: MarkdownSchema
  minItems?: number
  maxItems?: number
  uniqueItems?: boolean
  minimum?: number
  maximum?: number
  exclusiveMinimum?: number
  exclusiveMaximum?: number
  multipleOf?: number
  minLength?: number
  maxLength?: number
  pattern?: string
  minProperties?: number
  maxProperties?: number
  additionalProperties?: MarkdownSchema
  discriminator?: { propertyName: string; mapping?: Record<string, string> }
}

type RenderOptions = {
  hideDescription?: boolean
  hideDetails?: boolean
  property?: boolean
}

/** Schema normalization is cached separately from ancestry-dependent expansion. */
export type SchemaRenderer = {
  view: (schema: MarkdownSchema) => SchemaView
  render: (
    schema: MarkdownSchema,
    depth?: number,
    ancestors?: readonly unknown[],
    options?: RenderOptions,
  ) => RootContent[]
}

/** Keep merged reference siblings and sorted properties stable throughout an export. */
export const createSchemaRenderer = (): SchemaRenderer => {
  const views = new WeakMap<object, SchemaView>()
  const view = (input: MarkdownSchema): SchemaView => {
    const cached = typeof input === 'object' ? views.get(input) : undefined
    if (cached) return cached
    const target = getResolvedRef(input)
    // Keep the linked document's nested identities and boolean schemas. Coercing a
    // second time here would discard boolean children and copy recursive targets.
    const schema = typeof target === 'boolean' ? target : getResolvedRef(input, mergeSiblingReferences)
    const value = (typeof schema === 'object' ? schema : {}) as Omit<
      SchemaView,
      'schema' | 'properties' | 'required'
    > & {
      properties?: Record<string, MarkdownSchema>
      required?: string[]
    }
    const required = new Set(value.required ?? [])
    const properties = Object.entries(value.properties ?? {})
      .filter(([, child]) => typeof child === 'boolean' || (child !== null && typeof child === 'object'))
      .sort(([a], [b]) => Number(required.has(b)) - Number(required.has(a)) || a.localeCompare(b))
    const result = {
      ...value,
      type: typeof schema === 'boolean' ? (schema ? 'any' : 'never') : value.type,
      schema: schema as SchemaObject | boolean,
      required,
      properties,
    }
    if (typeof input === 'object') views.set(input, result)
    return result
  }
  const details = (
    value: SchemaView,
    property = false,
    hideDescription = false,
    showType = true,
  ): PhrasingContent[] => {
    if (typeof value.schema === 'boolean') return [text(value.schema ? 'any (true schema)' : 'never (false schema)')]
    const type = Array.isArray(value.type) ? value.type.join(' | ') : value.type
    const nodes: PhrasingContent[] = showType && (type || property) ? [inlineCode(type || 'object')] : []
    const add = (label: string, entry: unknown): void => {
      if (entry !== undefined) nodes.push(text(`${nodes.length ? ', ' : ''}${label}: `), inlineCode(entry))
    }
    add('format', value.format)
    if (value.enum) add('possible values', value.enum.map((entry) => JSON.stringify(entry)).join(', '))
    if (value.const !== undefined) add('const', JSON.stringify(value.const))
    if (value.default !== undefined) add('default', JSON.stringify(value.default))
    for (const key of [
      'minimum',
      'maximum',
      'exclusiveMinimum',
      'exclusiveMaximum',
      'multipleOf',
      'minLength',
      'maxLength',
      'pattern',
      'minProperties',
      'maxProperties',
    ] as const)
      add(key, value[key])
    for (const key of ['readOnly', 'writeOnly'] as const) {
      if (value[key]) nodes.push(text(`${nodes.length ? ', ' : ''}${key}`))
    }
    if (!hideDescription && value.description) nodes.push(text(`${nodes.length ? ' — ' : ''}${value.description}`))
    return nodes
  }
  const render: SchemaRenderer['render'] = (input, depth = 0, ancestors = [], options = {}) => {
    // Follow the original target: merging reference siblings creates fresh objects.
    const identity = getResolvedRef(input) ?? input
    if (typeof identity === 'object' && ancestors.includes(identity)) {
      return [paragraph({ type: 'emphasis', children: [text('[Circular Reference]')] })]
    }
    if (depth >= 64) return [paragraph(text('[Maximum schema depth reached]'))]
    const value = view(input)
    if (typeof value.schema === 'boolean') return options.hideDetails ? [] : [paragraph(...details(value))]
    const childAncestors = [...ancestors, identity]
    const nodes: RootContent[] = []
    for (const [key, label] of [
      ['allOf', 'All of:'],
      ['anyOf', 'Any of:'],
      ['oneOf', 'One of:'],
    ] as const) {
      if (value[key]?.length)
        nodes.push(
          paragraph(strong(text(label))),
          ...value[key].flatMap((child) => render(child, depth + 1, childAncestors)),
        )
    }
    if (value.not !== undefined)
      nodes.push(paragraph(strong(text('Not:'))), ...render(value.not, depth + 1, childAncestors))
    const object = value.type === 'object' || value.properties.length > 0
    const array = value.type === 'array' || value.items !== undefined
    if (!options.hideDetails) {
      const annotations = details(value, false, options.hideDescription, !object && !array)
      if (annotations.length) nodes.push(paragraph(...annotations))
    }
    if (value.properties.length) {
      const properties = value.properties.map(([name, schema]): ListItem => {
        const child = view(schema)
        const label: PhrasingContent[] = [inlineCode(name)]
        if (value.required.has(name)) label.push(text(' (required)'))
        const blocks: ListItem['children'] = [paragraph(strong(...label)), paragraph(...details(child, true))]
        blocks.push(
          ...(render(schema, depth + 1, childAncestors, { hideDetails: true, property: true }) as ListItem['children']),
        )
        return item(...blocks)
      })
      nodes.push(list(properties))
    }
    if (array && value.items !== undefined) {
      nodes.push(
        paragraph(strong(text(options.property ? 'Items:' : 'Array of:'))),
        ...render(value.items, depth + 1, childAncestors),
      )
    }
    const constraints: ListItem[] = []
    if (value.minItems !== undefined) constraints.push(item(paragraph(text('Min items: '), inlineCode(value.minItems))))
    if (value.maxItems !== undefined) constraints.push(item(paragraph(text('Max items: '), inlineCode(value.maxItems))))
    if (value.uniqueItems !== undefined)
      constraints.push(item(paragraph(text('Unique items: '), inlineCode(value.uniqueItems))))
    if (constraints.length) nodes.push(list(constraints))
    if (value.additionalProperties !== undefined)
      nodes.push(
        paragraph(strong(text('Additional properties:'))),
        ...render(value.additionalProperties, depth + 1, childAncestors),
      )
    if (value.discriminator) {
      nodes.push(paragraph(strong(text('Discriminator:')), text(' '), inlineCode(value.discriminator.propertyName)))
      const mappings = Object.entries(value.discriminator.mapping ?? {})
      if (mappings.length)
        nodes.push(
          list(mappings.map(([name, target]) => item(paragraph(inlineCode(name), text(': '), inlineCode(target))))),
        )
    }
    return nodes
  }
  return { view, render }
}
