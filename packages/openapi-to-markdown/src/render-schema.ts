import { getExampleFromSchema } from '@scalar/workspace-store/request-example'
import { resolve } from '@scalar/workspace-store/resolve'
import type { MaybeRefSchemaObject, SchemaObject } from '@scalar/workspace-store/schemas/v3.2/strict/schema'
import type { Code, ListItem, PhrasingContent, RootContent } from 'mdast'

import { inlineCode, item, list, paragraph, strong, text } from './markdown-nodes'

type SchemaView = {
  schema: SchemaObject
  title?: string
  description?: string
  type?: string | string[]
  format?: string
  enum?: unknown[]
  default?: unknown
  allOf?: MaybeRefSchemaObject[]
  anyOf?: MaybeRefSchemaObject[]
  oneOf?: MaybeRefSchemaObject[]
  not?: MaybeRefSchemaObject
  properties: [string, MaybeRefSchemaObject][]
  required: ReadonlySet<string>
  items?: MaybeRefSchemaObject
  minItems?: number
  maxItems?: number
  uniqueItems?: boolean
}

/** Schema normalization is cached separately from ancestry-dependent expansion. */
export type SchemaRenderer = {
  view: (schema: MaybeRefSchemaObject) => SchemaView
  render: (schema: MaybeRefSchemaObject, depth?: number, ancestors?: readonly unknown[]) => RootContent[]
  example: (schema: MaybeRefSchemaObject) => Code
}

/** Keep merged reference siblings and sorted properties stable throughout an export. */
export const createSchemaRenderer = (): SchemaRenderer => {
  const views = new WeakMap<object, SchemaView>()
  const view = (input: MaybeRefSchemaObject): SchemaView => {
    const cached = views.get(input)
    if (cached) return cached
    const schema = resolve.schema(input)
    const value = schema as Omit<SchemaView, 'schema' | 'properties' | 'required'> & {
      properties?: Record<string, MaybeRefSchemaObject>
      required?: string[]
    }
    const required = new Set(value.required ?? [])
    const properties = Object.entries(value.properties ?? {})
      .filter((entry) => entry[1] && typeof entry[1] === 'object')
      .sort(([a], [b]) => Number(required.has(b)) - Number(required.has(a)) || a.localeCompare(b))
    const result = { ...value, schema, required, properties }
    views.set(input, result)
    return result
  }
  const details = (value: SchemaView, property = false): PhrasingContent[] => {
    const type = Array.isArray(value.type) ? value.type.join(' | ') : value.type
    const nodes: PhrasingContent[] = type || property ? [inlineCode(type || 'object')] : []
    if (value.format) nodes.push(text(', format: '), inlineCode(value.format))
    if (value.enum)
      nodes.push(text(', possible values: '), inlineCode(value.enum.map((entry) => JSON.stringify(entry)).join(', ')))
    if (value.default !== undefined) nodes.push(text(', default: '), inlineCode(JSON.stringify(value.default)))
    if (value.description) nodes.push(text(` — ${value.description}`))
    return nodes
  }
  const render = (input: MaybeRefSchemaObject, depth = 0, ancestors: readonly unknown[] = []): RootContent[] => {
    // The previous renderer expanded a resolved root before tracking child reference strings.
    const identity = depth > 0 && '$ref' in input ? input.$ref : input
    if (depth >= 10 || ancestors.includes(identity)) {
      return [paragraph({ type: 'emphasis', children: [text('[Circular Reference]')] })]
    }
    const value = view(input)
    const childAncestors = [...ancestors, identity]
    for (const [key, label] of [
      ['allOf', 'All of:'],
      ['anyOf', 'Any of:'],
      ['oneOf', 'One of:'],
    ] as const) {
      if (value[key])
        return [
          paragraph(strong(text(label))),
          ...value[key].flatMap((child) => render(child, depth + 1, childAncestors)),
        ]
    }
    if (value.not) return [paragraph(strong(text('Not:'))), ...render(value.not, depth + 1, childAncestors)]
    if (value.type === 'object' || value.properties.length) {
      const properties = value.properties.map(([name, schema]): ListItem => {
        const child = view(schema)
        const label: PhrasingContent[] = [inlineCode(name)]
        if (value.required.has(name)) label.push(text(' (required)'))
        const blocks: ListItem['children'] = [paragraph(strong(...label)), paragraph(...details(child, true))]
        if (child.type === 'object' || child.properties.length) {
          blocks.push(...(render(schema, depth + 1, childAncestors) as ListItem['children']))
        }
        if (child.type === 'array' && child.items) {
          blocks.push(
            paragraph(strong(text('Items:'))),
            ...(render(child.items, depth + 1, childAncestors) as ListItem['children']),
          )
        }
        return item(...blocks)
      })
      return properties.length ? [list(properties)] : []
    }
    if (value.type === 'array' && value.items) {
      const nodes = [paragraph(strong(text('Array of:'))), ...render(value.items, depth + 1, childAncestors)]
      const constraints: ListItem[] = []
      if (value.minItems !== undefined)
        constraints.push(item(paragraph(text('Min items: '), inlineCode(value.minItems))))
      if (value.maxItems !== undefined)
        constraints.push(item(paragraph(text('Max items: '), inlineCode(value.maxItems))))
      if (value.uniqueItems) constraints.push(item(paragraph(text('Unique items: '), inlineCode(true))))
      if (constraints.length) nodes.push(list(constraints))
      return nodes
    }
    const nodes = details(value)
    return nodes.length ? [paragraph(...nodes)] : []
  }
  const example = (input: MaybeRefSchemaObject): Code => {
    const value = getExampleFromSchema(view(input).schema)
    return {
      type: 'code',
      lang: 'json',
      value: JSON.stringify(value, null, 2) ?? '',
    }
  }
  return { view, render, example }
}
