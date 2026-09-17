import { readFile } from 'node:fs/promises'
import { resolve as resolvePath } from 'node:path'
import { setImmediate } from 'node:timers/promises'

import { SYNTHETIC_BASE, baseAfterId, buildResourceRegistry } from '@amritk/helpers/build-resource-registry'
import { resolveRef } from '@amritk/helpers/resolve-ref'
import { resolveScopedRef } from '@amritk/helpers/resolve-scoped-ref'
import type { HttpMethod } from '@scalar/helpers/http/http-methods'
import { parseJsonPointerSegments } from '@scalar/helpers/json/parse-json-pointer-segments'
import { isObject } from '@scalar/helpers/object/is-object'
import { bundle } from '@scalar/json-magic/bundle'
import { fetchUrls, readFiles } from '@scalar/json-magic/bundle/plugins/node'
import { getValueByPath } from '@scalar/json-magic/helpers/get-value-by-path'
import { normalize } from '@scalar/json-magic/helpers/normalize'
import { getRaw } from '@scalar/json-magic/magic-proxy'
import { upgrade } from '@scalar/openapi-upgrader'
import { deepClone } from '@scalar/workspace-store/helpers/deep-clone'
import { getPathItemOperation, getResolvedPathItem } from '@scalar/workspace-store/helpers/for-each-path-item-operation'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type { OpenApiDocument, PathItemObject } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'
import { minify } from 'html-minifier-terser'
import rehypeParse from 'rehype-parse'
import rehypeRemark from 'rehype-remark'
import rehypeSanitize from 'rehype-sanitize'
import remarkGfm from 'remark-gfm'
import remarkStringify from 'remark-stringify'
import { unified } from 'unified'
import { createSSRApp } from 'vue'
import { renderToString } from 'vue/server-renderer'

import MarkdownReference from './components/MarkdownReference.vue'

type AnyDocument = OpenApiDocument | Record<string, unknown> | string
export type { HttpMethod }
export type OperationSelector =
  | {
      path: string
      method: HttpMethod | Uppercase<HttpMethod>
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
  webhook: { name: string; method: HttpMethod | Uppercase<HttpMethod> }
  introduction: true
}
type DocumentInput =
  | {
      document: Record<string, unknown>
    }
  | {
      url: string
    }
  | {
      path: string
    }
type OperationMatch = {
  path: string
  method: HttpMethod
}

const HTTP_METHODS: HttpMethod[] = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace']
const HTTP_METHOD_SET = new Set<string>(HTTP_METHODS)

const isHttpUrl = (value: string): boolean => {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

const toDocumentInput = (input: AnyDocument): DocumentInput => {
  if (typeof input !== 'string') {
    return { document: input as Record<string, unknown> }
  }

  const normalized = normalize(input)

  if (isObject(normalized)) {
    return { document: normalized as Record<string, unknown> }
  }

  if (isHttpUrl(input)) {
    return { url: input }
  }

  return { path: input }
}

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

  if (segments.length !== 3 || segments[0] !== 'paths') {
    throw new Error(`JSON pointer "${pointer}" must target an operation object under "/paths/{path}/{method}"`)
  }

  const path = segments[1]
  const method = segments[2]

  if (!path || !method) {
    throw new Error(`JSON pointer "${pointer}" must target an operation object under "/paths/{path}/{method}"`)
  }

  return {
    path,
    method: method as HttpMethod,
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

const filterPathItemToSingleOperation = (pathItem: PathItemObject, selectedMethod: HttpMethod): PathItemObject =>
  Object.fromEntries(
    Object.entries(pathItem).filter(([key]) => {
      const method = normalizeHttpMethod(key)
      return !method || method === selectedMethod
    }),
  )

const findOperationByPathAndMethod = (
  document: OpenApiDocument,
  selector: Extract<OperationSelector, { path: string }>,
): OperationMatch => {
  const method = normalizeHttpMethod(selector.method)

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
  getPathEntries(document).flatMap(([path, pathItem]) =>
    Object.entries(pathItem).flatMap(([methodKey, operation]) => {
      const method = normalizeHttpMethod(methodKey)

      if (!method || !isObject(operation)) {
        return []
      }

      const candidateOperationId =
        'operationId' in operation && typeof operation.operationId === 'string' ? operation.operationId : undefined

      if (candidateOperationId !== operationId) {
        return []
      }

      return [{ path, method }]
    }),
  )

const resolveOperationMatch = (document: OpenApiDocument, selector: OperationSelector): OperationMatch => {
  if ('pointer' in selector) {
    return findOperationByPathAndMethod(document, getOperationSelectorFromPointer(selector.pointer))
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
      [match.path]: filterPathItemToSingleOperation(pathItem, match.method),
    },
  }
}

/** Scope after resolving references and migrating older documents. */
const selectDocument = (document: OpenApiDocument, options: OpenApiRenderOptions = {}): OpenApiDocument => {
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
      const methods = HTTP_METHODS.filter((method) => getPathItemOperation(item, method)?.tags?.includes(options.tag!))
      if (methods.length) {
        selected.paths![path] = Object.fromEntries(
          Object.entries(item).filter(([key]) => !HTTP_METHOD_SET.has(key) || methods.includes(key as HttpMethod)),
        )
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
    const method = normalizeHttpMethod(selector.method)
    if (!method) {
      throw new Error(`Invalid HTTP method "${selector.method}"`)
    }
    const item = getResolvedPathItem(document.webhooks?.[selector.name])
    if (!item || !getPathItemOperation(item, method)) {
      throw new Error(`Webhook "${selector.name}" with method "${method.toUpperCase()}" was not found`)
    }
    selected.webhooks = { [selector.name]: filterPathItemToSingleOperation(item, method) }
  }
  const securityNames = new Set<string>()
  const tagNames = new Set<string>()
  for (const items of [selected.paths, selected.webhooks]) {
    for (const [path, itemRef] of Object.entries(items ?? {})) {
      const item = getResolvedPathItem(itemRef)!
      const scoped = { ...item, parameters: undefined, servers: undefined }
      for (const method of HTTP_METHODS) {
        const operation = getPathItemOperation(item, method)
        if (!operation) {
          continue
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
        scoped[method] = {
          ...operation,
          parameters: [...parameters.values()],
          servers: operation.servers ?? item.servers ?? document.servers,
          security,
          tags: options.tag !== undefined ? [options.tag] : operation.tags,
        }
      }
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

/**
 * Link references in a private, bundled document without proxies or expanded copies.
 * Non-enumerable links preserve serialization and share recursive schema targets.
 * Returns whether external references remain and require bundling.
 */
const attachRefValues = (document: unknown): boolean => {
  const registry = buildResourceRegistry(document)
  const seen = new WeakSet<object>()
  let hasExternalReferences = false
  const visit = (node: unknown, enclosing: string): void => {
    if (node === null || typeof node !== 'object' || seen.has(node)) {
      return
    }
    seen.add(node)
    const base = isObject(node) ? baseAfterId(node, enclosing) : enclosing
    if (isObject(node) && typeof node.$ref === 'string') {
      const ref = node.$ref
      const resource = ref.split('#')[0] ?? ''
      if (resource && (!registry || !resolveScopedRef(registry, resource, base))) {
        hasExternalReferences = true
      }
      // A registry is only needed for documents with embedded $id resources.
      const localPointer = ref.startsWith('#/') || ref === '#' ? ref.slice(1) : undefined
      const pointer = registry ? resolveScopedRef(registry, ref, base)?.pointer : localPointer
      let target: unknown
      if (pointer !== undefined) {
        target = getValueByPath(document, parseJsonPointerSegments(pointer)).value
      } else if (!registry && ref.startsWith('#') && isObject(document)) {
        target = resolveRef(ref, document)
      }
      if (target !== undefined) {
        Object.defineProperty(node, '$ref-value', {
          value: target,
          enumerable: false,
          configurable: true,
          writable: true,
        })
      }
    }
    for (const child of Object.values(node)) {
      visit(child, base)
    }
  }
  visit(document, SYNTHETIC_BASE)
  return hasExternalReferences
}

/** Load and bundle a private plain graph without creating an editable workspace. */
const loadDocument = async (input: AnyDocument): Promise<OpenApiDocument> => {
  const source = toDocumentInput(input)
  const load = async (): Promise<{ document: unknown; origin?: string }> => {
    if ('document' in source) return { document: deepClone(getRaw(source.document)) }
    if ('path' in source) {
      const origin = resolvePath(source.path)
      return { document: normalize(await readFile(origin, 'utf8')), origin }
    }
    const response = await fetch(source.url)
    if (!response.ok) throw new Error(`Failed to load OpenAPI document (HTTP ${response.status})`)
    return { document: normalize(await response.text()), origin: source.url }
  }
  const { document: raw, origin } = await load()
  if (!isObject(raw)) throw new Error('Failed to load OpenAPI document')
  const upgraded = upgrade(raw, '3.1')
  // Self-contained documents need no asynchronous bundler traversal.
  if (!attachRefValues(upgraded)) return upgraded as unknown as OpenApiDocument
  const errors: string[] = []
  const document = await bundle(upgraded, {
    plugins: [fetchUrls(), readFiles()],
    origin,
    treeShake: false,
    hooks: {
      onResolveError: (node) => {
        errors.push(`Failed to resolve ${node.$ref}`)
      },
    },
  })
  if (errors.length) throw new Error(errors.join('\n'))
  // The renderer reads shared reference values without wrapping the graph in proxies.
  attachRefValues(document)
  return document as unknown as OpenApiDocument
}

type RenderPart = { content: OpenApiDocument; introduction?: boolean; heading?: string }

/** Keep each Vue tree and Markdown syntax tree limited to one reference section. */
function* getRenderParts(content: OpenApiDocument): Generator<RenderPart> {
  const empty = {
    ...content,
    paths: {},
    webhooks: {},
    tags: [],
    components: { securitySchemes: content.components?.securitySchemes },
  }
  yield { content: empty, introduction: true }
  for (const [index, tag] of (content.tags ?? []).entries()) {
    yield { content: { ...empty, tags: [tag] }, heading: index === 0 ? 'Tags' : undefined }
  }
  for (const [key, heading] of [
    ['paths', 'Operations'],
    ['webhooks', 'Webhooks'],
  ] as const) {
    let first = true
    for (const [path, ref] of Object.entries(content[key] ?? {})) {
      const item = getResolvedPathItem(ref)
      if (!item) {
        continue
      }
      for (const methodKey of Object.keys(item)) {
        const method = normalizeHttpMethod(methodKey)
        if (!method || !getPathItemOperation(item, method)) {
          continue
        }
        yield {
          content: { ...empty, [key]: { [path]: filterPathItemToSingleOperation(item, method) } },
          heading: first ? heading : undefined,
        }
        first = false
      }
    }
  }
  let firstSchema = true
  for (const [name, schema] of Object.entries(content.components?.schemas ?? {})) {
    if (!getResolvedRef(schema)) {
      continue
    }
    yield {
      content: { ...empty, components: { ...empty.components, schemas: { [name]: schema } } },
      heading: firstSchema ? 'Schemas' : undefined,
    }
    firstSchema = false
  }
}

const renderPart = async (part: RenderPart, clean = true): Promise<string> => {
  const app = createSSRApp(MarkdownReference, {
    content: part.content,
    part: true,
    introduction: part.introduction ?? false,
  })
  const html = await renderToString(app)
  const result = `${part.heading ? `<h2>${part.heading}</h2>` : ''}${html}`
  if (!clean) {
    return result
  }
  return minify(result, {
    removeComments: true,
    removeEmptyElements: true,
    collapseWhitespace: true,
    continueOnParseError: true,
    noNewlinesBeforeTagClose: true,
    preserveLineBreaks: true,
    removeEmptyAttributes: true,
    decodeEntities: true,
    useShortDoctype: true,
  })
}

/** Render a prepared document as HTML, releasing each section before rendering the next. */
const renderDocumentAsHtml = async (document: OpenApiDocument, options?: OpenApiRenderOptions): Promise<string> => {
  const content = selectDocument(document, options)
  const output: string[] = []
  for (const part of getRenderParts(content)) {
    output.push(await renderPart(part))
    await setImmediate()
  }
  return output.join('')
}

/** Convert sections sequentially so large documents do not require a whole-document syntax tree. */
const renderDocumentAsMarkdown = async (document: OpenApiDocument, options?: OpenApiRenderOptions): Promise<string> => {
  const content = selectDocument(document, options)
  const output: string[] = []
  for (const part of getRenderParts(content)) {
    const markdown = (await markdownFromHtml(await renderPart(part, false))).trim()
    if (markdown) {
      output.push(markdown)
    }
    // Release the completed job before allocating the next section.
    await setImmediate()
  }
  return `${output.join('\n\n')}\n`
}

/** A prepared API description that can render multiple pages without loading it again. */
export type OpenApiMarkdownRenderer = {
  render: (options?: OpenApiRenderOptions) => Promise<string>
  renderHtml: (options?: OpenApiRenderOptions) => Promise<string>
}

/**
 * Load a private plain document once and reuse it across independently selected pages.
 * Each call converts sections sequentially without building a whole-document HTML tree.
 */
export const createOpenApiMarkdownRenderer = async (input: AnyDocument): Promise<OpenApiMarkdownRenderer> => {
  const document = await loadDocument(input)
  return {
    render: (options) => renderDocumentAsMarkdown(document, options),
    renderHtml: (options) => renderDocumentAsHtml(document, options),
  }
}

/** Render an API description as HTML with a temporary renderer. */
export const createHtmlFromOpenApi = async (input: AnyDocument, options?: OpenApiRenderOptions): Promise<string> => {
  const renderer = await createOpenApiMarkdownRenderer(input)
  return renderer.renderHtml(options)
}

/** Render an API description as Markdown with a temporary renderer. */
export const createMarkdownFromOpenApi = async (
  input: AnyDocument,
  options?: OpenApiRenderOptions,
): Promise<string> => {
  const renderer = await createOpenApiMarkdownRenderer(input)
  return renderer.render(options)
}

const markdownProcessor = unified()
  .use(rehypeParse, { fragment: true })
  .use(remarkGfm)
  .use(rehypeSanitize)
  .use(rehypeRemark)
  .use(remarkStringify, { bullet: '-' })
  .freeze()

const markdownFromHtml = async (html: string): Promise<string> => String(await markdownProcessor.process(html))
