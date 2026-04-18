import type { HarRequest } from '@scalar/snippetz'

import type { RequestPayload } from '@/request-example/builder/build-request'

type FetchRequestToHarProps = {
  /** The [url, RequestInit] tuple to convert, as returned by buildRequest */
  requestPayload: RequestPayload
  /**
   * Whether to include the request body in the HAR postData.
   * @default true
   */
  includeBody?: boolean
  /**
   * HTTP version string to use (Fetch API does not expose this).
   * @default 'HTTP/1.1'
   */
  httpVersion?: string
  /**
   * Maximum body size in bytes to capture in the HAR postData. Bodies larger
   * than this are omitted and recorded with bodySize -1.
   * @default 1048576 (1 MB)
   */
  bodySizeLimit?: number
}

/**
 * Converts a RequestPayload (url + RequestInit tuple) to HAR (HTTP Archive) Request format.
 *
 * The conversion handles:
 * - Request method and URL
 * - Headers extraction
 * - Query parameters extraction from URL
 * - Cookie extraction from headers
 * - Content-Type detection and MIME type extraction
 * - Size calculations for headers and body
 * - FormData and URLSearchParams bodies are converted to a params array
 * - String, Blob, and ArrayBuffer bodies are read as text
 * - Binary (octet-stream) and ReadableStream bodies are skipped
 *
 * @see https://w3c.github.io/web-performance/specs/HAR/Overview.html
 *
 * @example
 * const harRequest = await fetchRequestToHar({
 *   requestPayload: ['https://api.example.com/users', {
 *     method: 'POST',
 *     headers: { 'Content-Type': 'application/json' },
 *     body: JSON.stringify({ name: 'John' }),
 *   }],
 * })
 * console.log(harRequest.method) // 'POST'
 * console.log(harRequest.postData?.text) // '{"name":"John"}'
 */
export const fetchRequestToHar = async ({
  requestPayload,
  includeBody = true,
  httpVersion = 'HTTP/1.1',
  bodySizeLimit = 1048576,
}: FetchRequestToHarProps): Promise<HarRequest> => {
  const [originalUrl, requestInit] = requestPayload

  // Extract query string from URL
  const url = new URL(originalUrl)

  // Extract the query strings from the URL
  const queryString = Array.from(url.searchParams.entries()).map(([name, value]) => ({ name, value }))

  // Normalize HeadersInit to a Headers instance so we can call .get() and .entries() safely
  const _headers = new Headers(requestInit.headers)

  // Extract the MIME type from the request headers
  const mimeType = _headers.get('content-type')?.split(';')[0]?.trim() ?? 'text/plain'

  // Extract the headers from the request
  const { headers, headersSize, cookies } = processRequestHeaders(_headers)

  // Read the request body if requested
  const bodyDetails = await (async () => {
    if (includeBody && requestInit.body != null) {
      const details = await processRequestBody(requestInit.body, mimeType)
      if (details.size <= bodySizeLimit) {
        return details
      }
    }
    return { text: '', size: -1 }
  })()

  // Create the HAR request object
  const harRequest: HarRequest = {
    method: requestInit.method ?? 'GET',
    url: originalUrl,
    httpVersion,
    headers,
    cookies,
    queryString,
    headersSize,
    bodySize: bodyDetails.size,
    postData:
      'params' in bodyDetails
        ? {
            mimeType,
            params: bodyDetails.params,
          }
        : {
            mimeType,
            text: bodyDetails.text,
          },
  }

  return harRequest
}

type BodyDetails = { text: string; size: number } | { params: { name: string; value: string }[]; size: number }

/**
 * Extracts HAR body details from a BodyInit value.
 *
 * Because we own the RequestInit tuple we can inspect the body by type directly —
 * no stream cloning or header sniffing required.
 */
const processRequestBody = async (body: BodyInit, contentType: string): Promise<BodyDetails> => {
  // Structured form payloads become a params array so HAR viewers can render them as key/value tables
  if (body instanceof FormData) {
    return extractFormDataParams(body)
  }

  if (body instanceof URLSearchParams) {
    return extractUrlSearchParams(body)
  }

  // HAR text fields cannot represent arbitrary binary; skip rather than corrupt the entry
  if (contentType.includes('application/octet-stream')) {
    return { text: '', size: -1 }
  }

  if (typeof body === 'string') {
    // Use byte length, not character length, to match what the wire sends for multi-byte UTF-8
    const size = new TextEncoder().encode(body).byteLength
    return { text: body, size }
  }

  if (body instanceof Blob) {
    const text = await body.text()
    return { text, size: body.size }
  }

  if (body instanceof ArrayBuffer) {
    return { text: new TextDecoder().decode(body), size: body.byteLength }
  }

  if (ArrayBuffer.isView(body)) {
    return { text: new TextDecoder().decode(body), size: body.byteLength }
  }

  // ReadableStream cannot be read without consuming it
  return { text: '', size: -1 }
}

const extractFormDataParams = (formData: FormData): { params: { name: string; value: string }[]; size: number } => {
  return Array.from(formData.entries()).reduce<{ params: { name: string; value: string }[]; size: number }>(
    (acc, [name, value]) => {
      if (value instanceof File) {
        const fileName = `@${value.name}`
        acc.params.push({ name, value: fileName })
        acc.size += fileName.length
        return acc
      }

      acc.params.push({ name, value })
      acc.size += value.length
      return acc
    },
    { params: [], size: 0 },
  )
}

const extractUrlSearchParams = (
  params: URLSearchParams,
): { params: { name: string; value: string }[]; size: number } => {
  return Array.from(params.entries()).reduce<{ params: { name: string; value: string }[]; size: number }>(
    (acc, [name, value]) => {
      acc.params.push({ name, value })
      acc.size += name.length + value.length
      return acc
    },
    { params: [], size: 0 },
  )
}

const processRequestHeaders = (headers: Headers) => {
  return Array.from(headers.entries()).reduce<{
    headers: { name: string; value: string }[]
    headersSize: number
    cookies: { name: string; value: string }[]
  }>(
    (acc, [name, value]) => {
      if (name.toLowerCase() === 'cookie') {
        const parsedCookies = parseCookieHeader(value)
        acc.cookies.push(...parsedCookies.cookies)
      } else {
        acc.headers.push({ name, value })
        acc.headersSize += name.length + 2 + value.length + 2
      }
      return acc
    },
    { headers: [], headersSize: 0, cookies: [] },
  )
}

/**
 * Parses a Cookie header value into an array of cookie objects.
 * Cookie format: name1=value1; name2=value2
 */
const parseCookieHeader = (cookieValue: string) => {
  return cookieValue.split(';').reduce<{ cookies: { name: string; value: string }[]; size: number }>(
    (acc, part) => {
      const trimmedPart = part.trim()
      const equalIndex = trimmedPart.indexOf('=')

      if (equalIndex === -1) {
        return acc
      }

      const name = trimmedPart.substring(0, equalIndex).trim()
      const value = trimmedPart.substring(equalIndex + 1).trim()

      acc.cookies.push({ name, value })
      acc.size += name.length + 2 + value.length + 2
      return acc
    },
    { cookies: [], size: 0 },
  )
}
