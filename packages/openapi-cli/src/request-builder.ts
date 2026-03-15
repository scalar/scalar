import type { OpenAPI } from '@scalar/openapi-types'

export type BuildRequestInput = {
  /** HTTP method */
  method: string
  /** Path (with or without leading slash; normalized internally) */
  path: string
  /** Base URL (default from spec servers[0]) */
  baseUrl?: string
  /** Path parameters: { id: '123' } for /users/{id} */
  pathParams?: Record<string, string>
  /** Query parameters */
  query?: Record<string, string | string[]>
  /** Headers */
  headers?: Record<string, string>
  /** Request body (object or string) */
  body?: unknown
  /** OpenAPI spec (for server URL and security defaults) */
  spec?: OpenAPI.Document
  /** API key (for apiKey scheme) */
  apiKey?: string
  /** Bearer token */
  bearer?: string
}

export type BuildRequestResult = {
  url: string
  headers: Record<string, string>
  body?: string
}

/** Normalize path: ensure single leading slash, no trailing slash (unless root) */
export function normalizePath(path: string): string {
  const trimmed = path.trim()
  if (!trimmed) return '/'
  const withLeading = trimmed.startsWith('/') ? trimmed : `/${trimmed}`
  return withLeading
}

/** Replace {param} in path with values */
function substitutePathParams(path: string, params: Record<string, string>): string {
  return path.replace(/\{([^}]+)\}/g, (_, key) => params[key] ?? `{${key}}`)
}

/** Combine base URL and path with a single slash between them */
function combineUrlAndPath(base: string, path: string): string {
  const b = base.trim().replace(/\/+$/, '')
  const p = path.trim().replace(/^\/+/, '')
  return p ? `${b}/${p}` : b
}

/** Build query string from record (array values become repeated keys) */
function buildQueryString(query: Record<string, string | string[]>): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (Array.isArray(value)) {
      value.forEach((v) => params.append(key, String(v)))
    } else {
      params.set(key, String(value))
    }
  }
  const s = params.toString()
  return s ? `?${s}` : ''
}

/** Get default base URL from spec (servers[0], with variables substituted) */
function getDefaultBaseUrl(spec: OpenAPI.Document | undefined): string {
  if (!spec?.servers?.length) return ''
  const server = spec.servers[0]
  if (!server?.url) return ''
  let url = server.url
  if (server.variables && typeof server.variables === 'object') {
    for (const [name, config] of Object.entries(server.variables)) {
      const def = (config as { default?: string })?.default ?? ''
      url = url.replace(new RegExp(`\\{${name}\\}`, 'g'), def)
    }
  }
  return url.replace(/\/+$/, '')
}

/**
 * Build URL, headers, and body for an HTTP request from OpenAPI-style inputs.
 * Path is normalized (leading slash optional). Path params, query, headers, and body are applied.
 */
export function buildRequest(input: BuildRequestInput): BuildRequestResult {
  const {
    method,
    path,
    baseUrl: baseUrlOverride,
    pathParams = {},
    query = {},
    headers = {},
    body,
    spec,
    apiKey,
    bearer,
  } = input

  const baseUrl = baseUrlOverride ?? getDefaultBaseUrl(spec) ?? ''
  const normalizedPath = normalizePath(path)
  const pathWithParams = substitutePathParams(normalizedPath, pathParams)

  const queryWithAuth = { ...query }
  if (apiKey && spec?.components?.securitySchemes) {
    const schemes = spec.components.securitySchemes as Record<string, { in?: string; name?: string; type?: string }>
    for (const scheme of Object.values(schemes)) {
      if (scheme?.type === 'apiKey' && scheme.in === 'query' && scheme.name) {
        queryWithAuth[scheme.name] = apiKey
        break
      }
    }
  }

  const fullPath = pathWithParams + buildQueryString(queryWithAuth)
  const url = baseUrl ? combineUrlAndPath(baseUrl, fullPath) : fullPath

  const outHeaders: Record<string, string> = { ...headers }

  if (bearer) {
    outHeaders['Authorization'] = `Bearer ${bearer}`
  }

  if (apiKey && spec?.components?.securitySchemes) {
    const schemes = spec.components.securitySchemes as Record<string, { in?: string; name?: string; type?: string }>
    for (const scheme of Object.values(schemes)) {
      if (scheme?.type === 'apiKey' && scheme.in === 'header' && scheme.name) {
        outHeaders[scheme.name] = apiKey
        break
      }
    }
  }

  let bodyStr: string | undefined
  if (body !== undefined && body !== null && method !== 'GET') {
    bodyStr = typeof body === 'string' ? body : JSON.stringify(body)
    if (!outHeaders['Content-Type']) {
      outHeaders['Content-Type'] = 'application/json'
    }
  }

  return { url, headers: outHeaders, body: bodyStr }
}
