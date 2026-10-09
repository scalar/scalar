import { HTTP_METHODS, type HttpMethod } from '@scalar/helpers/http/http-methods'
import { isObject } from '@scalar/helpers/object/is-object'
import {
  forEachPathItemOperation,
  getPathItemOperation,
  getResolvedPathItem,
  setPathItemOperation,
} from '@scalar/workspace-store/helpers/for-each-path-item-operation'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type { OperationMethod } from '@scalar/workspace-store/schemas/navigation'
import type { OpenApiDocument, PathItemObject } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'

/** Identify one operation by path and method, operation ID, or JSON pointer. */
export type OperationSelector =
  | {
      path: string
      method: OperationMethod
    }
  | {
      operationId: string
    }
  | {
      pointer: string
    }
/** Select one reference page, or omit selectors for the whole document. */
export type OpenApiRenderOptions = SchemaReferenceOptions &
  (
    | {
        [Key in keyof PageSelectors]: Partial<Record<Exclude<keyof PageSelectors, Key>, never>> &
          Pick<PageSelectors, Key>
      }[keyof PageSelectors]
    | Partial<Record<keyof PageSelectors, never>>
  )

/** Control shared-schema expansion without assuming a documentation URL layout. */
export type SchemaReferenceOptions = {
  /** Expand root schemas, link nested references, and omit generated examples and the transitive appendix. */
  schemaReferences?: {
    mode: 'linked'
    /** Return a published URL, or undefined to retain the schema name as plain text. */
    resolveUrl?: (reference: { ref: string; name: string }) => string | undefined
    /**
     * Render references to primitive, enum and `const` schemas, and to aliases of them, in place
     * instead of linking them. Their whole definition fits on one line. Defaults to `true`.
     */
    inlinePrimitives?: boolean
  }
}

type PageSelectors = {
  operation: OperationSelector
  tag: string
  model: string
  webhook: { name: string; method: OperationMethod }
  introduction: true
}
type OperationMatch = { path: string; method: OperationMethod }

const HTTP_METHOD_SET = new Set<string>(HTTP_METHODS)

const normalizeHttpMethod = (method: string): HttpMethod | null => {
  const normalized = method.toLowerCase()

  if (HTTP_METHOD_SET.has(normalized)) {
    return normalized as HttpMethod
  }

  return null
}

const normalizeJsonPointer = (pointer: string): string => {
  if (/~(?![01])/.test(pointer)) {
    throw new Error(`Invalid JSON pointer escape in "${pointer}"`)
  }
  if (pointer.startsWith('#/')) {
    return pointer.slice(1)
  }

  if (pointer.startsWith('/')) {
    return pointer
  }

  throw new Error(`Invalid JSON pointer "${pointer}". JSON pointers must start with "#/"`)
}

const parseJsonPointer = (pointer: string): string[] =>
  normalizeJsonPointer(pointer)
    .slice(1)
    .split('/')
    .map((segment) => segment.replaceAll('~1', '/').replaceAll('~0', '~'))

const getOperationSelectorFromPointer = (pointer: string): Extract<OperationSelector, { path: string }> => {
  const segments = parseJsonPointer(pointer)

  if (
    segments[0] !== 'paths' ||
    !(segments.length === 3 || (segments.length === 4 && segments[2] === 'additionalOperations'))
  ) {
    throw new Error(`JSON pointer "${pointer}" must target an operation object under "/paths/{path}/{method}"`)
  }

  const path = segments[1]
  const method = segments.length === 4 ? segments[3] : segments[2]

  if (!path || !method || (segments.length === 3 ? !HTTP_METHOD_SET.has(method) : HTTP_METHOD_SET.has(method))) {
    throw new Error(`JSON pointer "${pointer}" must target an operation object under "/paths/{path}/{method}"`)
  }

  return {
    path,
    method,
  }
}

const getPathEntries = (document: OpenApiDocument): Array<[string, PathItemObject]> => {
  const paths = document.paths

  if (!isObject(paths)) {
    return []
  }

  return Object.entries(paths).flatMap(([path, pathItemRef]) => {
    const pathItem = getResolvedPathItem(pathItemRef)

    return pathItem ? [[path, pathItem]] : []
  })
}

/** Keep path metadata while excluding every unselected fixed or additional operation. */
const filterPathItemOperations = (pathItem: PathItemObject, methods: string[]): PathItemObject => {
  const selected: PathItemObject = Object.fromEntries(
    Object.entries(pathItem).filter(([key]) => !HTTP_METHOD_SET.has(key) && key !== 'additionalOperations'),
  )
  forEachPathItemOperation(pathItem, (method, operation) => {
    if (methods.includes(method)) {
      setPathItemOperation(selected, method, operation)
    }
  })
  return selected
}

/** Exact authored methods take precedence over the legacy uppercase fixed-method aliases. */
const resolveMethod = (pathItem: PathItemObject | undefined, method: string): string | null =>
  getPathItemOperation(pathItem, method) ? method : normalizeHttpMethod(method)

const findOperationByPathAndMethod = (
  document: OpenApiDocument,
  selector: Extract<OperationSelector, { path: string }>,
): OperationMatch => {
  const method = resolveMethod(getResolvedPathItem(document.paths?.[selector.path]), selector.method)

  if (!method) {
    throw new Error(`Invalid HTTP method "${selector.method}". Supported methods: ${HTTP_METHODS.join(', ')}`)
  }

  const pathItemRef = document.paths?.[selector.path]

  if (!getPathItemOperation(pathItemRef, method)) {
    throw new Error(`Operation not found for path "${selector.path}" and method "${method.toUpperCase()}"`)
  }

  return {
    path: selector.path,
    method,
  }
}

type TaggedPathItem = { path: string; pathItem: PathItemObject; methods: string[] }

/**
 * Lookups that every selection from one document shares, built on first use.
 * The document must not change while its lookup is in use.
 */
type DocumentLookup = {
  /** Operations by operation ID, in document order. */
  operationsById: () => ReadonlyMap<string, OperationMatch[]>
  /** Path items with the methods that carry each tag, in document order. */
  operationsByTag: () => ReadonlyMap<string, TaggedPathItem[]>
  /** The position of each schema in `components.schemas`. */
  schemaPositions: () => ReadonlyMap<string, number>
}

const indexOperations = (
  document: OpenApiDocument,
): { byId: Map<string, OperationMatch[]>; byTag: Map<string, TaggedPathItem[]> } => {
  const byId = new Map<string, OperationMatch[]>()
  const byTag = new Map<string, TaggedPathItem[]>()
  for (const [path, pathItem] of getPathEntries(document)) {
    forEachPathItemOperation(pathItem, (method, operationRef) => {
      const operation = getResolvedRef(operationRef)
      if (typeof operation?.operationId === 'string') {
        const matches = byId.get(operation.operationId) ?? []
        matches.push({ path, method })
        byId.set(operation.operationId, matches)
      }
      for (const tag of new Set(operation?.tags)) {
        const entries = byTag.get(tag) ?? []
        const last = entries.at(-1)
        if (last?.path === path) {
          last.methods.push(method)
        } else {
          entries.push({ path, pathItem, methods: [method] })
        }
        byTag.set(tag, entries)
      }
    })
  }
  return { byId, byTag }
}

/** Index a document once so that each selection costs time in proportion to what it selects. */
export const createDocumentLookup = (document: OpenApiDocument): DocumentLookup => {
  let operations: ReturnType<typeof indexOperations> | undefined
  let schemaPositions: Map<string, number> | undefined
  return {
    operationsById: () => (operations ??= indexOperations(document)).byId,
    operationsByTag: () => (operations ??= indexOperations(document)).byTag,
    schemaPositions: () =>
      (schemaPositions ??= new Map(
        Object.keys(document.components?.schemas ?? {}).map((name, position) => [name, position]),
      )),
  }
}

const resolveOperationMatch = (
  document: OpenApiDocument,
  selector: OperationSelector,
  lookup: DocumentLookup,
): OperationMatch => {
  if ('pointer' in selector) {
    const match = getOperationSelectorFromPointer(selector.pointer)
    if (!getPathItemOperation(document.paths?.[match.path], match.method)) {
      throw new Error(`Operation not found at JSON pointer "${selector.pointer}"`)
    }
    return match
  }

  if ('operationId' in selector) {
    const matches = lookup.operationsById().get(selector.operationId) ?? []

    if (!matches.length) {
      throw new Error(`Operation with operationId "${selector.operationId}" was not found`)
    }

    if (matches.length > 1) {
      const uniqueCandidates = matches.map(({ path, method }) => `"${method.toUpperCase()} ${path}"`)

      throw new Error(
        `Multiple operations found for operationId "${selector.operationId}". Use { path, method } instead. Matches: ${uniqueCandidates.join(', ')}`,
      )
    }

    return matches[0] as OperationMatch
  }

  return findOperationByPathAndMethod(document, selector)
}

const filterDocumentByOperation = (
  document: OpenApiDocument,
  selector: OperationSelector,
  lookup: DocumentLookup,
): OpenApiDocument => {
  const match = resolveOperationMatch(document, selector, lookup)
  const pathItem = getResolvedPathItem(document.paths?.[match.path])

  if (!pathItem) {
    throw new Error(`Operation not found for path "${match.path}" and method "${match.method.toUpperCase()}"`)
  }

  return {
    ...document,
    paths: {
      [match.path]: filterPathItemOperations(pathItem, [match.method]),
    },
  }
}

/**
 * Scope after resolving references and migrating older documents.
 * Pass the same lookup to every selection from one document to reuse its indexes.
 */
export const selectDocument = (
  document: OpenApiDocument,
  options: OpenApiRenderOptions = {},
  lookup: DocumentLookup = createDocumentLookup(document),
): OpenApiDocument => {
  if (!isObject(options)) {
    throw new Error('Render options must be an object')
  }
  const keys = Object.keys(options).filter(
    (key) => key !== 'schemaReferences' && options[key as keyof OpenApiRenderOptions] !== undefined,
  )
  if (!keys.length) {
    return document
  }
  if (keys.length !== 1 || !['operation', 'tag', 'model', 'webhook', 'introduction'].includes(keys[0]!)) {
    throw new Error('Specify exactly one of operation, tag, model, webhook, or introduction')
  }
  if (options.introduction !== undefined && options.introduction !== true) {
    throw new Error('Introduction selector must be true')
  }
  for (const key of ['tag', 'model'] as const) {
    if (options[key] !== undefined && (typeof options[key] !== 'string' || !options[key].length)) {
      throw new Error(`${key} selector must be a non-empty string`)
    }
  }
  if (options.operation !== undefined) {
    const selector = options.operation
    if (
      !isObject(selector) ||
      !(
        (Object.keys(selector).length === 1 &&
          ('operationId' in selector
            ? typeof selector.operationId === 'string' && selector.operationId.length
            : 'pointer' in selector && typeof selector.pointer === 'string' && selector.pointer.length)) ||
        (Object.keys(selector).length === 2 &&
          'path' in selector &&
          typeof selector.path === 'string' &&
          'method' in selector &&
          typeof selector.method === 'string')
      )
    ) {
      throw new Error('Invalid operation selector. Use { path, method }, { operationId }, or { pointer }')
    }
  }
  const selected: OpenApiDocument = { ...document, paths: {}, webhooks: {}, tags: [] }
  const modelRoots: unknown[] = []
  if (options.operation) {
    selected.paths = filterDocumentByOperation(document, options.operation, lookup).paths
  }
  if (options.tag !== undefined) {
    const metadata = document.tags?.filter((tag) => tag.name === options.tag) ?? []
    if (metadata.length > 1) {
      throw new Error(`Multiple tags found for "${options.tag}"`)
    }
    selected.tags = metadata.length ? metadata : [{ name: options.tag }]
    for (const { path, pathItem, methods } of lookup.operationsByTag().get(options.tag) ?? []) {
      selected.paths![path] = filterPathItemOperations(pathItem, methods)
    }
    if (!metadata.length && !Object.keys(selected.paths ?? {}).length) {
      throw new Error(`Tag "${options.tag}" was not found`)
    }
  }
  if (options.model !== undefined) {
    const schema = document.components?.schemas?.[options.model]
    if (schema === undefined || !Object.hasOwn(document.components?.schemas ?? {}, options.model)) {
      throw new Error(`Model "${options.model}" was not found`)
    }
    modelRoots.push(schema)
  }
  if (options.webhook !== undefined) {
    const selector = options.webhook
    if (
      !isObject(selector) ||
      typeof selector.name !== 'string' ||
      !selector.name ||
      typeof selector.method !== 'string' ||
      Object.keys(selector).length !== 2
    ) {
      throw new Error('Invalid webhook selector. Use { name, method }')
    }
    const item = getResolvedPathItem(document.webhooks?.[selector.name])
    const method = resolveMethod(item, selector.method)
    if (!method) {
      throw new Error(`Invalid HTTP method "${selector.method}"`)
    }
    if (!item || !getPathItemOperation(item, method)) {
      throw new Error(`Webhook "${selector.name}" with method "${method.toUpperCase()}" was not found`)
    }
    selected.webhooks = { [selector.name]: filterPathItemOperations(item, [method]) }
  }
  const securityNames = new Set<string>()
  const tagNames = new Set<string>()
  for (const items of [selected.paths, selected.webhooks]) {
    for (const [path, itemRef] of Object.entries(items ?? {})) {
      const item = getResolvedPathItem(itemRef)!
      const scoped = {
        ...item,
        additionalOperations: item.additionalOperations ? { ...item.additionalOperations } : undefined,
        parameters: undefined,
        servers: undefined,
      }
      forEachPathItemOperation(item, (method, operationRef) => {
        const operation = getResolvedRef(operationRef)
        if (!operation) {
          return
        }
        const parameters = new Map<string, NonNullable<typeof operation.parameters>[number]>()
        for (const ref of [...(item.parameters ?? []), ...(operation.parameters ?? [])]) {
          const parameter = getResolvedRef(ref)
          if (parameter) {
            parameters.set(`${parameter.in}:${parameter.name}`, ref)
          }
        }
        // Undeclared security stays undeclared: an empty list would claim that no authentication is required.
        const security = operation.security ?? document.security
        for (const requirement of security ?? []) {
          for (const name of Object.keys(requirement)) {
            securityNames.add(name)
          }
        }
        for (const name of operation.tags ?? []) {
          tagNames.add(name)
        }
        setPathItemOperation(scoped, method, {
          ...operation,
          parameters: [...parameters.values()],
          servers: operation.servers ?? item.servers ?? document.servers,
          security,
          tags: options.tag !== undefined ? [options.tag] : operation.tags,
        })
      })
      items![path] = scoped
    }
  }
  if (options.operation || options.webhook) {
    selected.tags = document.tags?.filter((tag) => tagNames.has(tag.name)) ?? []
  }
  if (options.introduction) {
    for (const requirement of document.security ?? []) {
      for (const name of Object.keys(requirement)) {
        securityNames.add(name)
      }
    }
  } else {
    selected.servers = []
    selected.security = undefined
  }
  const schemas = document.components?.schemas ?? {}
  const needed = new Set<string>(options.model !== undefined ? [options.model] : [])
  const visited = new WeakSet<object>()
  const references = new Set<string>()
  const opaqueValues = new Set(['example', 'examples', 'default', 'enum', 'const', 'value', 'dataValue'])
  const namedMaps = new Set([
    'paths',
    'webhooks',
    'responses',
    'content',
    'headers',
    'links',
    'encoding',
    'variables',
    'parameters',
    'requestBodies',
    'securitySchemes',
    'pathItems',
    'callbacks',
    'mediaTypes',
    'additionalOperations',
    'schemas',
    'properties',
    'patternProperties',
    '$defs',
    'definitions',
    'dependentSchemas',
  ])
  const visit = (value: unknown, namedLevels = 0): void => {
    if (!value || typeof value !== 'object' || visited.has(value)) {
      return
    }
    visited.add(value)
    if (!namedLevels && '$ref' in value && typeof value.$ref === 'string') {
      const ref = value.$ref
      if (!references.has(ref)) {
        references.add(ref)
        if (ref.startsWith('#/components/schemas/')) {
          const name = parseJsonPointer(ref)[2]!
          if (Object.hasOwn(schemas, name)) {
            needed.add(name)
            visit(schemas[name])
          }
        }
        visit(getResolvedRef(value as never), namedLevels)
      }
    }
    for (const [key, child] of Object.entries(value)) {
      // Names such as "example" are valid map entries; only keyword positions hold opaque data.
      if (key !== '$ref-value' && (namedLevels || (!opaqueValues.has(key) && !key.startsWith('x-')))) {
        const childNamedLevels = namedLevels ? namedLevels - 1 : key === 'callbacks' ? 2 : namedMaps.has(key) ? 1 : 0
        visit(child, childNamedLevels)
      }
    }
  }
  if (options.schemaReferences?.mode !== 'linked') {
    visit({ paths: selected.paths, webhooks: selected.webhooks })
    for (const root of modelRoots) {
      visit(root)
    }
  }
  const positions = lookup.schemaPositions()
  selected.components = {
    ...document.components,
    // Keep the document's schema order, which decides the order of the page's model sections.
    schemas: Object.fromEntries(
      [...needed]
        .filter((name) => positions.has(name))
        .sort((a, b) => positions.get(a)! - positions.get(b)!)
        .map((name) => [name, schemas[name]!]),
    ),
    securitySchemes: Object.fromEntries(
      Object.entries(document.components?.securitySchemes ?? {}).filter(([name]) => securityNames.has(name)),
    ),
  }
  return selected
}
