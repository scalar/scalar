import { isHttpMethod } from '@scalar/helpers/http/is-http-method'
import type { HarRequest } from '@scalar/types/snippetz'

type HeaderPair = {
  name: string
  value: string
}

type NameValuePair = {
  name: string
  value: string
}

type NameOptionalValuePair = {
  name: string
  value?: string
}

/**
 * Normalizes the request object with defaults
 */
export function normalizeRequest(request: Partial<HarRequest>): Partial<HarRequest> & { method: string } {
  return {
    ...request,
    method: normalizeMethod(request.method),
  }
}

/**
 * Encodes raw HAR query names and values when constructing a URL
 */
export function buildQueryString(queryParams?: Array<{ name: string; value: string }>): string {
  if (!queryParams?.length) {
    return ''
  }

  const queryPairs = queryParams.map((param) => `${encodeURIComponent(param.name)}=${encodeURIComponent(param.value)}`)
  return `?${queryPairs.join('&')}`
}

/**
 * Normalizes a request method.
 */
export const normalizeMethod = (method?: string): string =>
  method ? (isHttpMethod(method) && method === method.toLowerCase() ? method.toUpperCase() : method) : 'GET'

/**
 * Normalizes URL formatting while preserving origin-only paths.
 */
export const normalizeUrl = (url: string): string => {
  if (!url) {
    return ''
  }

  try {
    const parsedUrl = new URL(url)

    if (parsedUrl.pathname === '/') {
      return `${parsedUrl.origin}${parsedUrl.search}${parsedUrl.hash}`
    }

    return parsedUrl.toString()
  } catch {
    return url
  }
}

/**
 * Joins URL and query string while preserving existing query values.
 */
export const joinUrlAndQuery = (url: string, queryString?: NameValuePair[]): string => {
  const query = buildQueryString(queryString)

  if (!query) {
    return url
  }

  if (!url) {
    return query
  }

  const hashIndex = url.indexOf('#')
  const base = hashIndex === -1 ? url : url.slice(0, hashIndex)
  const hash = hashIndex === -1 ? '' : url.slice(hashIndex)
  return `${base}${base.includes('?') ? '&' : '?'}${query.slice(1)}${hash}`
}

/**
 * Collects deduplicated headers and optional cookie headers.
 */
export const collectHeaders = (headers?: NameOptionalValuePair[], cookies?: NameValuePair[]): HeaderPair[] => {
  const dedupedHeaders = new Map<string, string>()

  headers?.forEach((header) => {
    if (header.name) {
      dedupedHeaders.set(header.name, header.value ?? '')
    }
  })

  if (cookies?.length) {
    const cookieHeader = cookies
      .map((cookie) => `${encodeURIComponent(cookie.name)}=${encodeURIComponent(cookie.value)}`)
      .join('; ')
    dedupedHeaders.set('Cookie', cookieHeader)
  }

  return Array.from(dedupedHeaders.entries()).map(([name, value]) => ({ name, value }))
}

/**
 * Adds a named value while preserving repeated keys as arrays.
 */
export const accumulateRepeatedValue = (data: Record<string, string | string[]>, name: string, value: string): void => {
  const existingValue = data[name]

  if (existingValue === undefined) {
    data[name] = value
  } else if (Array.isArray(existingValue)) {
    existingValue.push(value)
  } else {
    data[name] = [existingValue, value]
  }
}

/**
 * Reduces query parameters into an object while preserving repeated keys as arrays.
 */
export function reduceQueryParams(query: HarRequest['queryString'] = []): Record<string, string | string[]> {
  return query.reduce<Record<string, string | string[]>>((acc, { name, value }) => {
    accumulateRepeatedValue(acc, name, value)
    return acc
  }, {})
}

/**
 * Processes headers and cookies into a headers object
 */
export function processHeaders(request: Partial<HarRequest>): Record<string, string> {
  const headers: Record<string, string> = {}

  // Process regular headers
  if (request.headers) {
    for (const header of request.headers) {
      if (header.value && !/[; ]/.test(header.name)) {
        headers[header.name] = header.value
      }
    }
  }

  // Process cookies
  if (request.cookies && request.cookies.length > 0) {
    const cookieString = request.cookies
      .map((cookie) => `${encodeURIComponent(cookie.name)}=${encodeURIComponent(cookie.value)}`)
      .join('; ')
    headers['Cookie'] = cookieString
  }

  return headers
}
