import type { HttpMethod } from '@scalar/helpers/http/http-methods'
import type { HarResponse } from '@scalar/snippetz'

import { getCookieHeaderKeys } from '@/v2/blocks/operation-block/helpers/get-cookie-header-keys'
import type { ResponseInstance } from '@/v2/blocks/operation-block/helpers/send-request'

type HarToFetchResponseProps = {
  /** The HAR Response object to convert */
  harResponse: HarResponse
  /** Optional URL to set on the Response object */
  url?: string
  /** The HTTP method used for the request */
  method: HttpMethod
  /** The request path */
  path: string
  /** Time in ms the request took */
  duration?: number
}

type ProcessedBody = {
  /** ArrayBuffer for Response body */
  body: ArrayBuffer | null
  /** Data for ResponseInstance (string or Blob) */
  data: string | Blob
  /** Size in bytes */
  size: number
}

/**
 * Converts a HAR (HTTP Archive) Response back to a ResponseInstance object.
 *
 * This function is the reverse of fetchResponseToHar - it takes a HAR response
 * and converts it back into a ResponseInstance object that includes both the
 * standard Fetch API Response properties and additional metadata.
 *
 * The conversion handles:
 * - Status code and status text restoration
 * - Headers reconstruction from HAR headers array
 * - Body decoding
 * - Content-Type and other header restoration
 * - URL property setting (if provided)
 * - Cookie header detection
 * - Duration tracking
 * - Response size calculation in bytes
 *
 * Body Handling:
 * - Plain text (no encoding): Text-based responses under 1MB from fetchResponseToHar
 * - Base64 encoded: Binary or legacy data (note: new HAR files won't contain binary data)
 * - Empty: Streaming responses, large responses (>1MB), or responses without bodies
 *
 * Use cases:
 * - Replaying recorded HTTP responses
 * - Creating mock responses from HAR files
 * - Testing with fixtures
 * - Response caching and restoration
 *
 * Note: The Fetch API Response object does not support setting the HTTP version,
 * so that information from the HAR is not preserved in the returned Response.
 * The URL property is set using Object.defineProperty since it is read-only
 * in the standard Response constructor.
 *
 * @see https://w3c.github.io/web-performance/specs/HAR/Overview.html
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Response
 *
 * @example
 * const harResponse = { status: 200, statusText: 'OK', ... }
 * const response = harToFetchResponse({
 *   harResponse,
 *   url: 'https://api.example.com',
 *   method: 'GET',
 *   path: '/users',
 *   duration: 250
 * })
 * console.log(response.url) // 'https://api.example.com'
 * console.log(response.duration) // 250
 */
export const harToFetchResponse = ({
  harResponse,
  url = '',
  method,
  path,
  duration = 0,
}: HarToFetchResponseProps): ResponseInstance => {
  const headers = buildHeaders(harResponse)
  const { body, data, size } = processBody(harResponse)
  const cookieHeaderKeys = getCookieHeaderKeys(headers)

  const response = new Response(body, {
    status: harResponse.status,
    statusText: harResponse.statusText,
    headers,
  })

  return {
    ...response,
    headers: Object.fromEntries(headers.entries()),
    cookieHeaderKeys,
    duration,
    status: harResponse.status,
    statusText: harResponse.statusText,
    method,
    path,
    data,
    size,
    url,
  }
}

/**
 * Builds Headers object and record from HAR response headers.
 */
const buildHeaders = (harResponse: HarResponse) => {
  const headers = new Headers()

  harResponse.headers.forEach(({ name, value }) => {
    headers.append(name, value)
  })

  return headers
}

/**
 * Processes HAR response body content.
 * Returns body, data and size for ResponseInstance.
 */
const processBody = (harResponse: HarResponse): ProcessedBody => {
  if (!harResponse.content.text) {
    return { body: null, data: '', size: 0 }
  }

  const { text, encoding } = harResponse.content

  if (encoding) {
    return { body: null, data: text, size: text.length }
  }

  const body = new TextEncoder().encode(text).buffer

  return { body, data: text, size: body.byteLength }
}
