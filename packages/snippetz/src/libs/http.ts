import type { HarRequest } from '@scalar/types/snippetz'

/**
 * Normalizes the request object with defaults
 */
export function normalizeRequest(request: Partial<HarRequest>): Partial<HarRequest> & { method: string } {
  return {
    ...request,
    method: (request.method || 'GET').toUpperCase(),
  }
}

/**
 * Builds the query string from request parameters
 */
export function buildQueryString(queryParams?: Array<{ name: string; value: string }>): string {
  if (!queryParams?.length) {
    return ''
  }

  const queryPairs = queryParams.map((param) => `${encodeURIComponent(param.name)}=${encodeURIComponent(param.value)}`)
  return `?${queryPairs.join('&')}`
}

/**
 * Creates a new URL search params object and sets query params so we can handle arrays
 */
export const createSearchParams = (query: HarRequest['queryString'] = []) => {
  const searchParams = new URLSearchParams()

  query.forEach((q: { name: string; value: string }) => {
    searchParams.append(q.name, q.value)
  })

  return searchParams
}

/**
 * Builds the complete URL with query string
 */
export function buildUrl(baseUrl: string, queryString: string): string {
  return `${baseUrl}${queryString}`
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
