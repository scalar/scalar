import { isObject } from '@scalar/helpers/object/is-object'
import { getResolvedRef, mergeSiblingReferences } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type { MaybeRefSchemaObject, SchemaObject } from '@scalar/workspace-store/schemas/v3.2/strict/schema'
import type { ListItem, PhrasingContent, RootContent } from 'mdast'

import { describe, emphasis, inlineCode, item, link, list, paragraph, safeUrl, strong, text } from './markdown-nodes'
import type { SchemaReferenceOptions } from './select-document'

/** Boolean schemas must survive rendering without being coerced into empty objects. */
type MarkdownSchema = MaybeRefSchemaObject | boolean

/** A normalized schema with sorted properties and annotations used throughout Markdown rendering. */
export type SchemaView = {
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
  deprecated?: boolean
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
  /** Set for references to a structured schema that is rendered once per document and referred to afterwards. */
  name?: string
  /**
   * The schema that carries the structure when this one only annotates it: a single-branch `allOf`,
   * or a union of one schema and `null`. Annotations here are merged over the core schema's.
   */
  core?: MarkdownSchema
  /** Whether a union with `null` wrapped the core schema. */
  nullable?: boolean
}

type RenderOptions = {
  hideDescription?: boolean
  hideDetails?: boolean
  property?: boolean
  /** Print the type even when properties or items imply it, for example as the first line of a union branch. */
  showType?: boolean
  /** Record this root under the given name, for example in its own model section, even if it is not a reference. */
  name?: string
}

/**
 * Schema normalization is cached separately from ancestry-dependent expansion.
 *
 * A renderer also tracks which shared schemas one output document already shows, so each one is
 * expanded once and referred to afterwards. Use `forDocument` for every document: renders can
 * run concurrently, and each needs its own record.
 */
export type SchemaRenderer = {
  linked: boolean
  view: (schema: MarkdownSchema) => SchemaView
  render: (
    schema: MarkdownSchema,
    depth?: number,
    ancestors?: readonly unknown[],
    options?: RenderOptions,
  ) => RootContent[]
  /** Restore the node budget, for example for each operation or model section. */
  beginSection: () => void
  /**
   * The schema to generate a model page's example from. In linked mode, nested references that the
   * page links become empty stubs, so the example shows this model's own fields and stays small.
   */
  exampleSchema: (schema: MarkdownSchema) => unknown
  /** Describe a schema on one line: its type, which may link to a model page, and its annotations. */
  summarize: (schema: MarkdownSchema) => PhrasingContent[]
  /** Report whether this document already expanded a schema, and how it labelled that expansion. */
  shownAs: (schema: MarkdownSchema) => ShownSchema | undefined
  /** Start a document that shares normalized views, given the models it renders in its own sections. */
  forDocument: (
    models?: Record<string, MarkdownSchema>,
    options?: SchemaReferenceOptions,
    destinations?: ReadonlyMap<string, string>,
  ) => SchemaRenderer
}

/** The first expansion of a shared schema, which later occurrences refer back to. */
export type ShownSchema = {
  /** The name later references use, usually the component name. */
  name: string
  /** The description printed with the expansion, which reference siblings can replace. */
  description?: string
}

type SchemaRendererOptions = {
  /** Upper bound on expanded schema nodes per section, so no description can make a page unbounded. */
  maxNodes?: number
}

/** Guards against stack exhaustion. Past it, references to models point to their own section instead. */
const MAX_DEPTH = 64

/**
 * Deduplicated output is proportional to the schema graph, so only a pathological description
 * (for example a YAML alias graph without references) reaches this.
 */
const MAX_NODES = 100_000

/** Keywords that `render` expands, as opposed to annotations that `details` prints on one line. */
const structuralKeywords = new Set([
  'allOf',
  'anyOf',
  'oneOf',
  'not',
  'properties',
  'required',
  'items',
  'additionalProperties',
  'discriminator',
  'minItems',
  'maxItems',
  'uniqueItems',
])

/** Link bookkeeping that is not a sibling keyword of a reference. */
const referenceKeys = new Set(['$ref', '$ref-value', '$global', '$status'])

/** The reference string of a Reference Object, if the schema is one. */
const getRef = (input: unknown): string | undefined =>
  isObject(input) && typeof input.$ref === 'string' ? input.$ref : undefined

/** Prefer the component name, which is how model sections and other references identify the schema. */
const getReferenceName = (ref: string): string => {
  try {
    // URI fragments are decoded before JSON Pointer segments and escapes, exactly once.
    const match = /^#\/components\/schemas\/([^/]+)$/.exec(decodeURIComponent(ref))
    return match ? match[1]!.replaceAll('~1', '/').replaceAll('~0', '~') : ref
  } catch {
    return ref
  }
}

/** Only references that add nothing structural can be replaced by the schema they point to. */
const getSharedName = (input: MarkdownSchema, view: Omit<SchemaView, 'name'>): string | undefined => {
  const ref = isObject(input) ? (input as { $ref?: unknown }).$ref : undefined
  if (typeof ref !== 'string' || typeof view.schema !== 'object') {
    return undefined
  }
  if (Object.keys(input).some((key) => structuralKeywords.has(key))) {
    return undefined
  }
  const structured =
    Boolean(view.allOf?.length || view.anyOf?.length || view.oneOf?.length || view.properties.length) ||
    view.not !== undefined ||
    view.items !== undefined ||
    view.additionalProperties !== undefined
  // Leaf schemas are as short as a reference to them, so they stay in place.
  return structured ? getReferenceName(ref) : undefined
}

/**
 * A named model with structural reference siblings is its own schema, not another
 * occurrence of its target. Otherwise either rendering order can hide properties.
 * Follow the original target otherwise: merging reference siblings creates fresh objects.
 */
const getSharedIdentity = (input: MarkdownSchema): object | undefined => {
  const identity =
    isObject(input) && '$ref' in input && Object.keys(input).some((key) => structuralKeywords.has(key))
      ? input
      : (getResolvedRef(input) ?? input)
  return typeof identity === 'object' && identity !== null ? identity : undefined
}

/** Boolean targets still combine with adjacent schema keywords. */
const resolveMarkdownSchema = (input: MarkdownSchema): unknown => {
  const target = getResolvedRef(input)
  const merged = getResolvedRef(input, mergeSiblingReferences)
  if (typeof target !== 'boolean') {
    return merged
  }
  if (
    !isObject(merged) ||
    !Object.keys(merged).some((key) => !['$ref', '$ref-value', '$global', '$status'].includes(key))
  ) {
    return target
  }
  if (target) {
    return merged
  }
  // A false target remains impossible, even when siblings describe a type or annotations.
  return { ...merged, allOf: [false, ...(Array.isArray(merged.allOf) ? merged.allOf : [])] }
}

/** Annotations that a wrapper schema contributes on top of the schema it wraps. */
const annotationKeys = ['title', 'description', 'default', 'readOnly', 'writeOnly', 'deprecated'] as const

/** Only annotation-only wrappers can be replaced without losing independent constraints. */
const wrapperKeys = new Set<string>([...annotationKeys, ...referenceKeys, '__scalar_', 'allOf', 'anyOf', 'oneOf'])

/** Types that never need their own page: their whole definition fits on one line. */
const primitiveTypes = new Set(['string', 'number', 'integer', 'boolean', 'null'])

/** Infer the JSON type of a literal, for `const` and `enum` schemas that do not declare one. */
const getJsonType = (value: unknown): string => {
  if (value === null) {
    return 'null'
  }
  if (Array.isArray(value)) {
    return 'array'
  }
  if (typeof value === 'number') {
    return Number.isInteger(value) ? 'integer' : 'number'
  }
  return typeof value
}

/** A schema that only allows `null`, as in `anyOf: [X, { type: 'null' }]`. */
const isNullSchema = (input: unknown): boolean => {
  const schema = getResolvedRef(input as MarkdownSchema)
  if (!isObject(schema)) {
    return false
  }
  const type = Array.isArray(schema.type) && schema.type.length === 1 ? schema.type[0] : schema.type
  return (
    type === 'null' &&
    Object.keys(schema).every(
      (key) => key === 'type' || key === 'title' || key === 'description' || referenceKeys.has(key),
    )
  )
}

/** Wrappers that only annotate one schema, or make it nullable, describe that schema. */
const getWrapped = (value: SchemaView): { core: MarkdownSchema; nullable: boolean } | undefined => {
  if (
    typeof value.schema !== 'object' ||
    Object.keys(value.schema).some((key) => !wrapperKeys.has(key)) ||
    value.type !== undefined ||
    value.properties.length ||
    value.required.size ||
    value.items !== undefined ||
    value.additionalProperties !== undefined ||
    value.not !== undefined ||
    value.discriminator ||
    value.enum ||
    value.const !== undefined
  ) {
    return undefined
  }
  const allOf = value.allOf ?? []
  const anyOf = value.anyOf ?? []
  const oneOf = value.oneOf ?? []
  if (allOf.length === 1 && !anyOf.length && !oneOf.length) {
    return { core: allOf[0]!, nullable: false }
  }
  const union = anyOf.length ? anyOf : oneOf
  if (allOf.length || (anyOf.length && oneOf.length) || union.length !== 2) {
    return undefined
  }
  const core = union.filter((branch) => !isNullSchema(branch))
  return core.length === 1 ? { core: core[0]!, nullable: true } : undefined
}

/** A one-line type, and whether it says everything about the schema's structure. */
type TypeLabel = { nodes: PhrasingContent[]; complete: boolean }

/** Join alternatives with `|`, keeping neighbouring plain types in one code span. */
const joinAlternatives = (alternatives: PhrasingContent[][]): PhrasingContent[] => {
  // `array of string | null` would read as an array of nullable strings.
  const groupedAlternatives = alternatives.map((alternative) => {
    const only = alternative.length === 1 ? alternative[0] : undefined
    return alternatives.length > 1 && only?.type === 'inlineCode' && only.value.startsWith('array of ')
      ? [inlineCode(`(${only.value})`)]
      : alternative
  })
  const nodes: PhrasingContent[] = []
  let plain: string[] = []
  const flushPlain = (): void => {
    if (plain.length) {
      nodes.push(...(nodes.length ? [text(' | ')] : []), inlineCode(plain.join(' | ')))
    }
    plain = []
  }
  for (const alternative of groupedAlternatives) {
    const only = alternative.length === 1 ? alternative[0] : undefined
    if (only?.type === 'inlineCode') {
      plain.push(only.value)
      continue
    }
    flushPlain()
    nodes.push(...(nodes.length ? [text(' | ')] : []), ...alternative)
  }
  flushPlain()
  return nodes
}

/** Keep merged reference siblings and sorted properties stable throughout an export. */
export const createSchemaRenderer = ({ maxNodes = MAX_NODES }: SchemaRendererOptions = {}): SchemaRenderer => {
  const views = new WeakMap<object, SchemaView>()
  /** Wrappers being unwrapped, so a wrapper that refers to itself stops unwrapping. */
  const unwrapping = new Set<object>()
  const view = (input: MarkdownSchema): SchemaView => {
    const cached = typeof input === 'object' ? views.get(input) : undefined
    if (cached) {
      return cached
    }
    // Keep the linked document's nested identities and boolean schemas. Coercing a
    // second time here would discard boolean children and copy recursive targets.
    const schema = resolveMarkdownSchema(input)
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
    const booleanType = schema ? 'any' : 'never'
    let result: SchemaView = {
      ...value,
      type: typeof schema === 'boolean' ? booleanType : value.type,
      schema: schema as SchemaObject | boolean,
      required,
      properties,
    }
    result.name = getSharedName(input, result)
    const wrapped = typeof input === 'object' && !unwrapping.has(input) ? getWrapped(result) : undefined
    if (wrapped && typeof input === 'object') {
      unwrapping.add(input)
      const inner = view(wrapped.core)
      unwrapping.delete(input)
      const annotations = Object.fromEntries(
        annotationKeys.flatMap((key) => (result[key] === undefined ? [] : [[key, result[key]]])),
      )
      result = { ...inner, ...annotations, core: wrapped.core, nullable: wrapped.nullable || inner.nullable }
    }
    if (typeof input === 'object') {
      views.set(input, result)
    }
    return result
  }
  const primitives = new WeakMap<object, boolean>()
  /** Primitives, enums, consts and aliases of them, whose whole definition fits on one line. */
  const isPrimitive = (input: MarkdownSchema): boolean => {
    if (typeof input !== 'object') {
      return true
    }
    const cached = primitives.get(input)
    if (cached !== undefined) {
      return cached
    }
    // Assume a recursive alias is not primitive while it is being checked.
    primitives.set(input, false)
    const value = view(input)
    const types = value.type === undefined ? [] : [value.type].flat()
    const result =
      value.core !== undefined
        ? isPrimitive(value.core)
        : typeof value.schema === 'boolean' ||
          (!value.properties.length &&
            value.items === undefined &&
            (value.additionalProperties === undefined || typeof value.additionalProperties === 'boolean') &&
            !value.allOf?.length &&
            !value.anyOf?.length &&
            !value.oneOf?.length &&
            value.not === undefined &&
            !value.discriminator &&
            types.every((type) => primitiveTypes.has(type)))
    primitives.set(input, result)
    return result
  }
  /** Whether the one-line summary of a schema has anything besides its type. */
  const hasAnnotations = (value: SchemaView): boolean =>
    value.description !== undefined ||
    value.format !== undefined ||
    value.enum !== undefined ||
    value.const !== undefined ||
    value.default !== undefined ||
    value.readOnly === true ||
    value.writeOnly === true ||
    value.deprecated === true ||
    value.additionalProperties === false ||
    numericAnnotations.some((key) => value[key] !== undefined)
  const numericAnnotations = [
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
    'minItems',
    'maxItems',
    'uniqueItems',
  ] as const
  /** The declared types, or the types implied by `const`, `enum`, properties or items. */
  const getTypes = (value: SchemaView): string[] => {
    if (value.type !== undefined) {
      return [value.type].flat()
    }
    if (value.const !== undefined) {
      return [getJsonType(value.const)]
    }
    if (value.enum?.length) {
      return [...new Set(value.enum.map(getJsonType))]
    }
    if (value.properties.length || isObject(value.additionalProperties)) {
      return ['object']
    }
    if (value.items !== undefined) {
      return ['array']
    }
    return []
  }

  const forDocument = (
    models: Record<string, MarkdownSchema> = {},
    settings: SchemaReferenceOptions = {},
    destinations?: ReadonlyMap<string, string>,
  ): SchemaRenderer => {
    const linked = settings.schemaReferences?.mode === 'linked'
    const inlinePrimitives = settings.schemaReferences?.inlinePrimitives !== false
    /** Shared schemas this document already expanded, with the name later references use. */
    const shown = new Map<object, ShownSchema>()
    /** Models that the document renders in their own sections after the operations. */
    const sections = new Set<unknown>(Object.values(models).map((model) => getResolvedRef(model) ?? model))
    let nodeCount = 0

    /** The reference a nested schema links to in linked mode, instead of expanding its target. */
    const getLink = (input: MarkdownSchema): string | undefined => {
      if ((!linked && !destinations) || !isObject(input)) {
        return undefined
      }
      const ref = getRef(input)
      if (ref !== undefined) {
        // A primitive alias is shorter than a link to it, and saves the reader a page.
        const resolved = getResolvedRef(input) !== undefined
        if (!linked && !destinations?.has(getReferenceName(ref))) {
          return undefined
        }
        return resolved && inlinePrimitives && isPrimitive(input) ? undefined : ref
      }
      const core = view(input).core
      return core === undefined ? undefined : getLink(core)
    }
    const referenceNode = (ref: string): PhrasingContent => {
      const name = getReferenceName(ref)
      const url = settings.schemaReferences?.resolveUrl
        ? settings.schemaReferences.resolveUrl({ ref, name })
        : destinations?.get(name)
      return url && safeUrl(url) ? link(url, name) : inlineCode(name)
    }
    /** Annotations written next to a linked reference; the linked page documents its target. */
    const getLinkAnnotations = (input: MarkdownSchema): SchemaView => {
      const own: Record<string, unknown> = {}
      let current: unknown = input
      while (isObject(current)) {
        for (const [key, entry] of Object.entries(current)) {
          if (
            !referenceKeys.has(key) &&
            (!structuralKeywords.has(key) ||
              numericAnnotations.some((annotation) => annotation === key) ||
              (key === 'additionalProperties' && entry === false)) &&
            !(key in own)
          ) {
            own[key] = entry
          }
        }
        if (getRef(current) !== undefined) {
          break
        }
        current = view(current as MarkdownSchema).core
      }
      return view(own as MarkdownSchema)
    }

    /** The annotations a nested schema prints next to its type: for a link, only those beside the reference. */
    const getOwnView = (input: MarkdownSchema): SchemaView =>
      getLink(input) === undefined ? view(input) : getLinkAnnotations(input)

    const getLabel = (input: MarkdownSchema, nested: boolean, depth = 0): TypeLabel => {
      const value = view(input)
      const ref = nested || destinations ? getLink(input) : undefined
      if (ref !== undefined) {
        // A reference to a nullable model is already nullable; a nullable wrapper around one is not.
        const nullable = getRef(input) === undefined && value.nullable
        const structural = isObject(input) && Object.keys(input).some((key) => structuralKeywords.has(key))
        return {
          nodes: joinAlternatives([[referenceNode(ref)], ...(nullable ? [[inlineCode('null')]] : [])]),
          complete: !structural,
        }
      }
      if (typeof value.schema === 'boolean') {
        return { nodes: [], complete: true }
      }
      const types = getTypes(value)
      const alternatives: PhrasingContent[][] = []
      let complete =
        !value.properties.length &&
        !isObject(value.additionalProperties) &&
        value.not === undefined &&
        !value.discriminator &&
        !value.allOf?.length &&
        !(value.anyOf?.length && value.oneOf?.length)
      const union = value.anyOf?.length ? value.anyOf : value.oneOf
      if (union?.length) {
        const branches = depth < 8 ? union.map((branch) => getLabel(branch, true, depth + 1)) : []
        // A union of fully described branches reads as one type, for example `string | integer`.
        if (
          complete &&
          !types.length &&
          branches.length === union.length &&
          branches.every(
            (branch, index) => branch.complete && branch.nodes.length && !hasAnnotations(getOwnView(union[index]!)),
          )
        ) {
          alternatives.push(...branches.map((branch) => branch.nodes))
        } else {
          complete = false
        }
      }
      for (const type of types) {
        if (type !== 'array' || value.items === undefined) {
          alternatives.push([inlineCode(type)])
          continue
        }
        const items = depth < 8 ? getLabel(value.items, true, depth + 1) : undefined
        if (!items?.complete || !items.nodes.length || hasAnnotations(getOwnView(value.items))) {
          complete = false
          alternatives.push([inlineCode('array')])
          continue
        }
        const only = items.nodes.length === 1 ? items.nodes[0] : undefined
        alternatives.push(
          only?.type === 'inlineCode'
            ? [inlineCode(only.value.includes(' | ') ? `array of (${only.value})` : `array of ${only.value}`)]
            : [text('array of '), ...(items.nodes.length > 1 ? [text('('), ...items.nodes, text(')')] : items.nodes)],
        )
      }
      if (!types.length && value.items !== undefined) {
        complete = false
      }
      // Without a type to name, a nullable schema says so and leaves its structure to the lines below.
      if (value.nullable && !types.includes('null')) {
        alternatives.push(alternatives.length || complete ? [inlineCode('null')] : [text('nullable')])
      }
      // A schema without types or structure accepts any value.
      if (!alternatives.length && complete) {
        alternatives.push([inlineCode('any')])
      }
      return { nodes: joinAlternatives(alternatives), complete }
    }

    /** The one-line summary of a schema: its type, then its annotations. */
    const summarize = (
      input: MarkdownSchema,
      {
        nested,
        label = getLabel(input, nested),
        showType = true,
      }: { nested: boolean; label?: TypeLabel; showType?: boolean },
    ): { line: PhrasingContent[]; description?: string } => {
      const linkedLabel = (nested || destinations !== undefined) && getLink(input) !== undefined
      const value = linkedLabel ? getLinkAnnotations(input) : view(input)
      if (typeof value.schema === 'boolean') {
        return { line: [text(value.schema ? 'any (true schema)' : 'never (false schema)')] }
      }
      const nodes: PhrasingContent[] = showType ? [...label.nodes] : []
      const add = (name: string, entry: unknown): void => {
        if (entry !== undefined) {
          nodes.push(text(`${nodes.length ? ', ' : ''}${name}: `), inlineCode(entry))
        }
      }
      const flag = (name: string, entry: unknown): void => {
        if (entry) {
          nodes.push(text(`${nodes.length ? ', ' : ''}${name}`))
        }
      }
      // Later references to a shared schema point back to this name.
      const ref = getRef(input)
      if (!linkedLabel && value.name !== undefined) {
        // In linked mode the expanded schema also has its own page.
        if (linked && ref !== undefined) {
          nodes.push(text(`${nodes.length ? ', ' : ''}schema: `), referenceNode(ref))
        } else {
          add('schema', value.name)
        }
      }
      if (linkedLabel && value.type !== undefined) {
        add('type', [value.type].flat().join(' | '))
      }
      add('format', value.format)
      if (value.enum) {
        add('possible values', value.enum.map((entry) => JSON.stringify(entry)).join(', '))
      }
      if (value.const !== undefined) {
        add('const', JSON.stringify(value.const))
      }
      if (value.default !== undefined) {
        add('default', JSON.stringify(value.default))
      }
      for (const key of numericAnnotations) {
        add(key, value[key])
      }
      for (const key of ['readOnly', 'writeOnly', 'deprecated'] as const) {
        flag(key, value[key])
      }
      flag('no additional properties', value.additionalProperties === false)
      // A reference without its own description still says what it is, from the schema it links to.
      return { line: nodes, description: value.description ?? (linkedLabel ? view(input).description : undefined) }
    }

    /** Refer to a schema expanded elsewhere, keeping annotations the reference itself adds. */
    const reference = (
      input: MarkdownSchema,
      options: RenderOptions,
      name: string,
      location: string,
    ): RootContent[] => {
      const nodes: RootContent[] = []
      const siblings = isObject(input)
        ? Object.fromEntries(Object.entries(input).filter(([key]) => !referenceKeys.has(key)))
        : {}
      if (Object.keys(siblings).length && !options.hideDetails) {
        const { line, description } = summarize(siblings as MarkdownSchema, { nested: false, showType: false })
        if (line.length) {
          nodes.push(paragraph(...line))
        }
        if (!options.hideDescription) {
          nodes.push(...describe(description))
        }
      }
      nodes.push(paragraph(emphasis(text('Schema '), inlineCode(name), text(` is shown ${location}.`))))
      return nodes
    }

    /** Print a schema's summary line and description, unless the caller already did. */
    const header = (input: MarkdownSchema, depth: number, options: RenderOptions, showType = true): RootContent[] => {
      if (options.hideDetails) {
        return []
      }
      const { line, description } = summarize(input, { nested: depth > 0, showType })
      return [...(line.length ? [paragraph(...line)] : []), ...(options.hideDescription ? [] : describe(description))]
    }

    const render: SchemaRenderer['render'] = (input, depth = 0, ancestors = [], options = {}) => {
      if ((linked || destinations) && isObject(input) && '$ref' in input && typeof input.$ref === 'string') {
        const target = getResolvedRef(input)
        // Reference siblings are independent constraints, not replacements for target keywords.
        const siblings = Object.fromEntries(Object.entries(input).filter(([key]) => !referenceKeys.has(key)))
        const hasSiblings = Object.keys(siblings).length > 0
        if (((depth > 0 || destinations) && getLink(input) !== undefined) || target === undefined) {
          // The summary links to the model page; only structural siblings still need rendering.
          const structural = Object.fromEntries(Object.entries(siblings).filter(([key]) => structuralKeywords.has(key)))
          return [
            ...header(input, Math.max(depth, 1), options),
            ...(Object.keys(structural).length
              ? render(structural as MarkdownSchema, depth, ancestors, { hideDetails: true })
              : []),
          ]
        }
        // An alias with siblings is another reference boundary. Keep its reference visible
        // instead of overwriting it with the outer reference during normalization.
        if (!destinations && depth === 0 && (hasSiblings || (isObject(target) && '$ref' in target))) {
          return [
            ...(hasSiblings ? [paragraph(strong(text('All of:')))] : []),
            ...render(target as MarkdownSchema, depth + 1, ancestors),
            ...(hasSiblings ? render(siblings as MarkdownSchema, depth, ancestors) : []),
          ]
        }
      }
      // Follow the original target: merging reference siblings creates fresh objects.
      const identity = getResolvedRef(input) ?? input
      if (typeof identity === 'object' && ancestors.includes(identity)) {
        return [paragraph(emphasis(text('[Circular Reference]')))]
      }
      const value = view(input)
      const label = getLabel(input, depth > 0)
      // A wrapper prints its merged summary, then its core schema's structure.
      if (value.core !== undefined) {
        const nodes = header(input, depth, options)
        if (label.complete) {
          return nodes
        }
        return [
          ...nodes,
          ...render(value.core, depth, ancestors, {
            hideDetails: true,
            hideDescription: true,
            property: options.property,
          }),
        ]
      }
      const shared = getSharedIdentity(input)
      const name = options.name ?? value.name
      if (!destinations && shared && name !== undefined) {
        // Expanding every path through a shared schema grows exponentially, so expand it once.
        const previous = shown.get(shared)
        if (previous !== undefined) {
          // A model section already prints its own annotations above the schema.
          const referenceOptions = options.name === undefined ? options : { ...options, hideDetails: true }
          return reference(input, referenceOptions, previous.name, 'above')
        }
        if (value.name !== undefined && options.name === undefined && depth >= MAX_DEPTH && sections.has(shared)) {
          return reference(input, options, value.name, 'below under Schemas')
        }
      }
      if (depth >= MAX_DEPTH) {
        return [paragraph(text('[Maximum schema depth reached]'))]
      }
      if (nodeCount >= maxNodes) {
        return [paragraph(emphasis(text('[Schema output truncated]')))]
      }
      nodeCount++
      if (shared && name !== undefined && !shown.has(shared)) {
        shown.set(shared, { name, description: value.description })
      }
      if (typeof value.schema === 'boolean') {
        return header(input, depth, options)
      }
      const childAncestors = [...ancestors, identity]
      const nodes: RootContent[] = []
      // Discriminator values that name a branch are printed beside it instead of in a separate list.
      const mappings = Object.entries(value.discriminator?.mapping ?? {})
      const mapped = new Set<string>()
      let discriminatorShown = false
      if (!label.complete) {
        for (const [key, title] of [
          ['allOf', 'All of:'],
          ['anyOf', 'Any of:'],
          ['oneOf', 'One of:'],
        ] as const) {
          if (!value[key]?.length) {
            continue
          }
          // One list item per branch keeps the boundary between branches visible.
          const branches = value[key].map((child) => {
            const blocks = render(child, depth + 1, childAncestors, { showType: true }) as ListItem['children']
            const ref = getRef(child)
            const values = key === 'allOf' || ref === undefined ? [] : mappings.filter(([, target]) => target === ref)
            const first = blocks[0]
            if (values.length && first?.type === 'paragraph') {
              for (const [name] of values) {
                mapped.add(name)
              }
              first.children.push(
                text(`${first.children.length ? ', ' : ''}${value.discriminator!.propertyName}: `),
                inlineCode(values.map(([name]) => name).join(', ')),
              )
            }
            return item(...blocks)
          })
          const discriminated = key !== 'allOf' && value.discriminator
          nodes.push(
            paragraph(
              strong(text(title)),
              ...(discriminated ? [text(' discriminated by '), inlineCode(value.discriminator!.propertyName)] : []),
            ),
            list(branches),
          )
          if (discriminated) {
            discriminatorShown = true
          }
        }
        if (value.not !== undefined) {
          nodes.push(paragraph(strong(text('Not:'))), ...render(value.not, depth + 1, childAncestors))
        }
      }
      // Child sections imply a single container type, but never its nullable alternatives.
      const impliedType =
        !options.showType &&
        !label.complete &&
        ((value.type === 'object' && value.properties.length > 0) ||
          (value.type === 'array' && value.items !== undefined))
      nodes.push(...header(input, depth, options, !impliedType))
      if (linked || destinations) {
        // A reference sibling may require a field declared only in the target schema.
        const declared = new Set(value.properties.map(([name]) => name))
        const required = [...value.required].filter((name) => !declared.has(name))
        if (required.length) {
          nodes.push(paragraph(strong(text('Required fields:')), text(' '), inlineCode(required.join(', '))))
        }
      }
      if (value.properties.length) {
        const properties = value.properties.map(([name, schema]): ListItem => {
          const childLabel = getLabel(schema, true)
          const { line, description } = summarize(schema, { nested: true, label: childLabel })
          const title: PhrasingContent[] = [
            strong(inlineCode(name), ...(value.required.has(name) ? [text(' (required)')] : [])),
          ]
          if (line.length) {
            title.push(text(': '), ...line)
          }
          const blocks: ListItem['children'] = [paragraph(...title), ...describe(description)]
          if (!childLabel.complete) {
            blocks.push(
              ...(render(schema, depth + 1, childAncestors, {
                hideDetails: true,
                hideDescription: true,
                property: true,
              }) as ListItem['children']),
            )
          }
          return item(...blocks)
        })
        nodes.push(list(properties))
      }
      if (
        !label.complete &&
        value.items !== undefined &&
        (value.type === 'array' || value.type === undefined || [value.type].flat().includes('array'))
      ) {
        nodes.push(
          paragraph(strong(text(options.property ? 'Items:' : 'Array of:'))),
          ...render(value.items, depth + 1, childAncestors),
        )
      }
      if (isObject(value.additionalProperties)) {
        nodes.push(
          paragraph(strong(text('Additional properties:'))),
          ...render(value.additionalProperties as MarkdownSchema, depth + 1, childAncestors),
        )
      }
      const unmapped = mappings.filter(([name]) => !mapped.has(name))
      if (value.discriminator && (!discriminatorShown || unmapped.length)) {
        nodes.push(paragraph(strong(text('Discriminator:')), text(' '), inlineCode(value.discriminator.propertyName)))
        if (unmapped.length) {
          nodes.push(
            list(
              unmapped.map(([name, target]) =>
                item(
                  paragraph(
                    inlineCode(name),
                    text(': '),
                    linked || destinations ? referenceNode(target) : inlineCode(target),
                  ),
                ),
              ),
            ),
          )
        }
      }
      return nodes
    }
    /** Keywords whose values are schemas, and whether each holds a list or a map of them. */
    const schemaKeywords: Record<string, 'one' | 'list' | 'map'> = {
      items: 'one',
      additionalProperties: 'one',
      not: 'one',
      prefixItems: 'list',
      allOf: 'list',
      anyOf: 'list',
      oneOf: 'list',
      properties: 'map',
      patternProperties: 'map',
    }
    const getExampleSchema = (input: unknown, root: boolean): unknown => {
      if (!isObject(input)) {
        return input
      }
      if (!root && getLink(input as MarkdownSchema) !== undefined) {
        const types = getTypes(view(input as MarkdownSchema))
        return types.includes('array') && !types.includes('object') ? { type: 'array', items: {} } : { type: 'object' }
      }
      // Primitive references stay linked; a spread copy would lose the non-enumerable target.
      if (getRef(input) !== undefined) {
        if (!root) {
          return input
        }
        // Merging keeps the `$ref` key, which must not be followed again.
        const merged = getResolvedRef(input as MarkdownSchema, mergeSiblingReferences)
        if (!isObject(merged)) {
          return merged
        }
        const { $ref: _ref, ...target } = merged
        return getExampleSchema(target, true)
      }
      const copy: Record<string, unknown> = { ...input }
      for (const [key, kind] of Object.entries(schemaKeywords)) {
        const value = input[key]
        if (kind === 'one') {
          copy[key] = getExampleSchema(value, false)
        } else if (kind === 'list' && Array.isArray(value)) {
          copy[key] = value.map((entry) => getExampleSchema(entry, false))
        } else if (kind === 'map' && isObject(value)) {
          copy[key] = Object.fromEntries(
            Object.entries(value).map(([name, entry]) => [name, getExampleSchema(entry, false)]),
          )
        }
        if (copy[key] === undefined) {
          delete copy[key]
        }
      }
      return copy
    }
    return {
      linked,
      view,
      render,
      exampleSchema: (schema) => (linked ? getExampleSchema(schema, true) : schema),
      summarize: (schema) => summarize(schema, { nested: false }).line,
      beginSection: () => {
        nodeCount = 0
      },
      shownAs: (schema) => {
        const shared = getSharedIdentity(schema)
        return shared ? shown.get(shared) : undefined
      },
      forDocument,
    }
  }
  return forDocument()
}
