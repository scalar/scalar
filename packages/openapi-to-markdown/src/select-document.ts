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
export type OpenApiRenderOptions =
  | {
      [Key in keyof PageSelectors]: Partial<Record<Exclude<keyof PageSelectors, Key>, never>> & Pick<PageSelectors, Key>
    }[keyof PageSelectors]
  | Partial<Record<keyof PageSelectors, never>>

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

const findOperationsByOperationId = (document: OpenApiDocument, operationId: string): OperationMatch[] =>
  getPathEntries(document).flatMap(([path, pathItem]) => {
    const matches: OperationMatch[] = []
    forEachPathItemOperation(pathItem, (method, operation) => {
      if (getResolvedRef(operation)?.operationId === operationId) {
        matches.push({ path, method })
      }
    })
    return matches
  })

const resolveOperationMatch = (document: OpenApiDocument, selector: OperationSelector): OperationMatch => {
  if ('pointer' in selector) {
    const match = getOperationSelectorFromPointer(selector.pointer)
    if (!getPathItemOperation(document.paths?.[match.path], match.method)) {
      throw new Error(`Operation not found at JSON pointer "${selector.pointer}"`)
    }
    return match
  }

  if ('operationId' in selector) {
    const matches = findOperationsByOperationId(document, selector.operationId)

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

const filterDocumentByOperation = (document: OpenApiDocument, selector: OperationSelector): OpenApiDocument => {
  const match = resolveOperationMatch(document, selector)
  const pathItem = getPathEntries(document).find(([path]) => path === match.path)?.[1]

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

/** Scope after resolving references and migrating older documents. */
export const selectDocument = (document: OpenApiDocument, options: OpenApiRenderOptions = {}): OpenApiDocument => {
  if (!isObject(options)) {
    throw new Error('Render options must be an object')
  }
  const keys = Object.keys(options).filter((key) => options[key as keyof OpenApiRenderOptions] !== undefined)
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
    selected.paths = filterDocumentByOperation(document, options.operation).paths
  }
  if (options.tag !== undefined) {
    const metadata = document.tags?.filter((tag) => tag.name === options.tag) ?? []
    if (metadata.length > 1) {
      throw new Error(`Multiple tags found for "${options.tag}"`)
    }
    selected.tags = metadata.length ? metadata : [{ name: options.tag }]
    for (const [path, item] of getPathEntries(document)) {
      const methods: string[] = []
      forEachPathItemOperation(item, (method, operation) => {
        if (getResolvedRef(operation)?.tags?.includes(options.tag!)) {
          methods.push(method)
        }
      })
      if (methods.length) {
        selected.paths![path] = filterPathItemOperations(item, methods)
      }
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
        const security = operation.security ?? document.security ?? []
        for (const requirement of security) {
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
  visit({ paths: selected.paths, webhooks: selected.webhooks })
  for (const root of modelRoots) {
    visit(root)
  }
  selected.components = {
    ...document.components,
    schemas: Object.fromEntries(Object.entries(schemas).filter(([name]) => needed.has(name))),
    securitySchemes: Object.fromEntries(
      Object.entries(document.components?.securitySchemes ?? {}).filter(([name]) => securityNames.has(name)),
    ),
  }
  return selected
}
