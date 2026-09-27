/*
 * Shared, framework-free helpers for the free OpenAPI tools on scalar.com.
 *
 * Everything here is a plain ES module with no DOM access, so the same code
 * runs in the browser (loaded by the tool scripts) and in Node (for tests).
 * Libraries are injected rather than imported, because the browser loads them
 * from jsDelivr while Node uses the npm packages.
 */

/** Pinned versions. Bump both together after checking the tools still work. */
export const PARSER_VERSION = '0.29.7'
export const YAML_VERSION = '2.9.1'

const PARSER_URL = `https://cdn.jsdelivr.net/npm/@scalar/openapi-parser@${PARSER_VERSION}/+esm`
const YAML_URL = `https://cdn.jsdelivr.net/npm/yaml@${YAML_VERSION}/+esm`

let librariesPromise

/**
 * Load @scalar/openapi-parser and yaml from jsDelivr, once per page.
 * A failed load is not cached, so a flaky connection can retry.
 */
export const loadLibraries = () => {
  if (!librariesPromise) {
    librariesPromise = Promise.all([import(PARSER_URL), import(YAML_URL)])
      .then(([parser, YAML]) => ({ parser, YAML }))
      .catch((error) => {
        librariesPromise = undefined
        throw error
      })
  }
  return librariesPromise
}

/** JSON looks like an object or array from its first non-space character. */
export const looksLikeJson = (text) => /^\s*[[{]/.test(text)

/**
 * Parse JSON or YAML text into a plain object.
 *
 * Returns `{ ok, value, format }` or `{ ok: false, error: { message, line, column } }`.
 * Positions are 1-based so they can be shown to people as-is.
 */
export const parseText = (text, YAML) => {
  if (typeof text !== 'string' || !text.trim()) {
    return { ok: false, error: { message: 'Paste an OpenAPI document (JSON or YAML) to get started.' } }
  }

  if (looksLikeJson(text)) {
    try {
      return { ok: true, value: JSON.parse(text), format: 'json' }
    } catch (error) {
      return { ok: false, format: 'json', error: jsonErrorPosition(text, error) }
    }
  }

  try {
    const lineCounter = new YAML.LineCounter()
    const document = YAML.parseDocument(text, { lineCounter, uniqueKeys: true })
    if (document.errors.length) {
      const first = document.errors[0]
      const position = first.linePos?.[0]
      return {
        ok: false,
        format: 'yaml',
        error: {
          message: first.message.split('\n')[0],
          line: position?.line,
          column: position?.col,
        },
      }
    }
    const value = document.toJS({ maxAliasCount: 1000 })
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return { ok: false, format: 'yaml', error: { message: 'The document must be a JSON or YAML object.' } }
    }
    return { ok: true, value, format: 'yaml' }
  } catch (error) {
    return { ok: false, format: 'yaml', error: { message: String(error?.message ?? error).split('\n')[0] } }
  }
}

/** Browsers report JSON errors differently; pull out a position when we can. */
const jsonErrorPosition = (text, error) => {
  const message = String(error?.message ?? error)
  const lineColumn = message.match(/line (\d+) column (\d+)/i)
  if (lineColumn) {
    return { message, line: Number(lineColumn[1]), column: Number(lineColumn[2]) }
  }
  const offset = message.match(/position (\d+)/i)
  if (offset) {
    const before = text.slice(0, Number(offset[1])).split('\n')
    return { message, line: before.length, column: before[before.length - 1].length + 1 }
  }
  return { message }
}

/** Serialize to JSON or YAML with stable, readable output. */
export const stringify = (value, format, YAML) => {
  if (format === 'yaml') {
    // Repeated objects stay repeated: anchors and aliases confuse more tools than they help.
    return YAML.stringify(value, { lineWidth: 0, aliasDuplicateObjects: false })
  }
  return `${JSON.stringify(value, null, 2)}\n`
}

/* ---------- JSON pointers ---------- */

export const escapePointerSegment = (segment) => String(segment).replace(/~/g, '~0').replace(/\//g, '~1')

export const unescapePointerSegment = (segment) => segment.replace(/~1/g, '/').replace(/~0/g, '~')

/** Build a JSON pointer from path segments. */
export const toPointer = (segments) => (segments.length ? `/${segments.map(escapePointerSegment).join('/')}` : '')

/** Split a JSON pointer (with or without a leading `#`) into segments. */
export const fromPointer = (pointer) => {
  const clean = String(pointer ?? '').replace(/^#/, '')
  if (!clean || clean === '/') {
    return []
  }
  return clean.replace(/^\//, '').split('/').map(unescapePointerSegment)
}

/** Read the value at a path, or undefined. */
export const getAtPath = (root, segments) => {
  let current = root
  for (const segment of segments) {
    if (current === null || typeof current !== 'object') {
      return undefined
    }
    current = current[segment]
  }
  return current
}

/* ---------- Local $ref resolution ---------- */

/**
 * Resolve a local `$ref` (like `#/components/schemas/Planet`) against the root.
 * External references are not fetched: the tools never make network requests
 * with your document, so they stay unresolved.
 */
export const resolveLocalRef = (root, ref) => {
  if (typeof ref !== 'string' || !ref.startsWith('#')) {
    return undefined
  }
  return getAtPath(root, fromPointer(ref))
}

/**
 * Return a copy of `value` with local references inlined.
 *
 * Circular references are cut off and replaced with a short description, so the
 * result is always plain, finite JSON. `maxDepth` guards against documents that
 * are not circular but are still enormous.
 */
export const inlineRefs = (value, root, { maxDepth = 24 } = {}) => {
  const walk = (node, stack, depth) => {
    if (node === null || typeof node !== 'object') {
      return node
    }
    if (depth > maxDepth) {
      return { description: 'Nested too deeply to preview.' }
    }
    if (Array.isArray(node)) {
      return node.map((item) => walk(item, stack, depth + 1))
    }
    if (typeof node.$ref === 'string') {
      const ref = node.$ref
      if (stack.includes(ref)) {
        const name = ref.split('/').pop()
        return { type: 'object', description: `Circular reference to ${name}.` }
      }
      const target = resolveLocalRef(root, ref)
      if (target === undefined) {
        return { ...node }
      }
      // Sibling keywords next to $ref (allowed in OpenAPI 3.1) win over the target.
      const { $ref: _ignored, ...siblings } = node
      const resolved = walk(target, [...stack, ref], depth + 1)
      return resolved && typeof resolved === 'object' && !Array.isArray(resolved)
        ? { ...resolved, ...walk(siblings, stack, depth + 1) }
        : resolved
    }
    const result = {}
    for (const [key, child] of Object.entries(node)) {
      result[key] = walk(child, stack, depth + 1)
    }
    return result
  }
  return walk(value, [], 0)
}

/* ---------- Documents ---------- */

/** Detect the declared version of a document: '2.0', '3.0', '3.1', '3.2' or undefined. */
export const detectVersion = (document) => {
  if (!document || typeof document !== 'object') {
    return undefined
  }
  if (typeof document.swagger === 'string' && document.swagger.startsWith('2.')) {
    return '2.0'
  }
  const match = typeof document.openapi === 'string' ? document.openapi.match(/^3\.(\d+)/) : null
  return match ? `3.${match[1]}` : undefined
}

export const HTTP_METHODS = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace']

/**
 * List every operation in an OpenAPI 3.x document, including path-level
 * parameters merged into each operation (operation-level entries win).
 */
export const listOperations = (document) => {
  const operations = []
  const paths = document?.paths && typeof document.paths === 'object' ? document.paths : {}
  for (const [path, rawPathItem] of Object.entries(paths)) {
    const pathItem =
      typeof rawPathItem?.$ref === 'string' ? (resolveLocalRef(document, rawPathItem.$ref) ?? {}) : rawPathItem
    if (!pathItem || typeof pathItem !== 'object') {
      continue
    }
    const shared = Array.isArray(pathItem.parameters) ? pathItem.parameters : []
    for (const method of HTTP_METHODS) {
      const operation = pathItem[method]
      if (!operation || typeof operation !== 'object') {
        continue
      }
      const own = Array.isArray(operation.parameters) ? operation.parameters : []
      const byKey = new Map()
      for (const raw of [...shared, ...own]) {
        const parameter = typeof raw?.$ref === 'string' ? resolveLocalRef(document, raw.$ref) : raw
        if (parameter && typeof parameter === 'object' && parameter.name && parameter.in) {
          byKey.set(`${parameter.in}:${parameter.name}`, parameter)
        }
      }
      operations.push({ method, path, operation, parameters: [...byKey.values()] })
    }
  }
  return operations
}

/**
 * Put the well-known top-level keys first, in the order the specification
 * lists them. Upgraders tend to append `openapi` at the end, which reads oddly.
 */
export const orderTopLevelKeys = (document) => {
  const order = [
    'openapi',
    'swagger',
    'info',
    'jsonSchemaDialect',
    'servers',
    'host',
    'basePath',
    'schemes',
    'consumes',
    'produces',
    'security',
    'tags',
    'paths',
    'webhooks',
    'components',
    'definitions',
    'parameters',
    'responses',
    'securityDefinitions',
    'externalDocs',
  ]
  const result = {}
  for (const key of order) {
    if (key in document) {
      result[key] = document[key]
    }
  }
  for (const [key, value] of Object.entries(document)) {
    if (!(key in result)) {
      result[key] = value
    }
  }
  return result
}

/* ---------- Share links ---------- */

const toBase64Url = (bytes) => {
  let binary = ''
  const chunk = 0x8000
  for (let index = 0; index < bytes.length; index += chunk) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunk))
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

const fromBase64Url = (text) => {
  const base64 = text.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }
  return bytes
}

const pipeThrough = async (bytes, stream) => {
  const response = new Response(new Blob([bytes]).stream().pipeThrough(stream))
  return new Uint8Array(await response.arrayBuffer())
}

const canCompress = () => typeof CompressionStream === 'function' && typeof DecompressionStream === 'function'

/**
 * Encode tool state (any JSON value) for a URL hash.
 *
 * `z.` payloads are deflate-raw compressed; `j.` payloads are plain UTF-8 for
 * browsers without CompressionStream. Both are base64url, so they are safe in
 * a URL without further escaping.
 */
export const encodeState = async (state) => {
  const bytes = new TextEncoder().encode(JSON.stringify(state))
  if (canCompress()) {
    try {
      return `z.${toBase64Url(await pipeThrough(bytes, new CompressionStream('deflate-raw')))}`
    } catch {
      // Fall through to the uncompressed form.
    }
  }
  return `j.${toBase64Url(bytes)}`
}

/** Decode a value produced by `encodeState`. Returns undefined when it cannot. */
export const decodeState = async (payload) => {
  try {
    if (typeof payload !== 'string') {
      return undefined
    }
    if (payload.startsWith('z.')) {
      if (!canCompress()) {
        return undefined
      }
      const bytes = await pipeThrough(fromBase64Url(payload.slice(2)), new DecompressionStream('deflate-raw'))
      return JSON.parse(new TextDecoder().decode(bytes))
    }
    if (payload.startsWith('j.')) {
      return JSON.parse(new TextDecoder().decode(fromBase64Url(payload.slice(2))))
    }
  } catch {
    // A truncated or edited link is not worth an error dialog.
  }
  return undefined
}

/** The hash key the tools use, so page anchors keep working. */
export const SHARE_HASH_KEY = 's'

/** Longest share link we produce. Browsers cope with more, chat apps often do not. */
export const MAX_SHARE_URL_LENGTH = 60000

/** Read the share payload from a `#s=...` hash. */
export const readShareHash = (hash) => {
  const match = String(hash ?? '').match(new RegExp(`^#?${SHARE_HASH_KEY}=(.+)$`))
  return match ? match[1] : undefined
}
