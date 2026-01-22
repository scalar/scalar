import type { HttpMethod } from '@scalar/helpers/http/http-methods'
import type { Response as HarResponse } from 'har-format'

import { getCookieHeaderKeys } from '@/v2/blocks/operation-block/helpers/get-cookie-header-keys'
import type { ResponseInstance } from '@/v2/blocks/operation-block/helpers/send-request'

export type HarToFetchResponseProps = {
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
 * - Body decoding from base64 (if encoded) back to original content
 * - Content-Type and other header restoration
 * - URL property setting (if provided)
 * - Cookie header detection
 * - Duration tracking
 * - Response size calculation
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
  url,
  method,
  path,
  duration = 0,
}: HarToFetchResponseProps): ResponseInstance => {
  // Reconstruct headers as both a Headers object (for Response) and Record (for ResponseInstance)
  const headersObj = new Headers()
  const headersRecord: Record<string, string> = {}
  for (const header of harResponse.headers) {
    headersObj.append(header.name, header.value)
    headersRecord[header.name] = header.value
  }

  // Decode the body from base64 if it is encoded
  let body: ArrayBuffer | null = null
  let data: string | Blob = ''
  let size = 0

  if (harResponse.content.text) {
    if (harResponse.content.encoding === 'base64') {
      // Decode from base64 to ArrayBuffer
      body = base64ToArrayBuffer(harResponse.content.text)
      // For ResponseInstance, we store the decoded text or as Blob
      const blob = new Blob([body], {
        type: harResponse.content.mimeType || 'application/octet-stream',
      })
      data = blob
      size = blob.size
    } else {
      // If not base64 encoded, treat as plain text
      body = new TextEncoder().encode(harResponse.content.text).buffer
      data = harResponse.content.text
      size = harResponse.content.text.length
    }
  }

  // Create the Fetch Response object
  const response = new Response(body, {
    status: harResponse.status,
    statusText: harResponse.statusText,
    headers: headersObj,
  })

  // Set the URL if provided. The Response object has a read-only url property,
  // so we need to use Object.defineProperty to override it.
  if (url) {
    Object.defineProperty(response, 'url', {
      value: url,
      writable: false,
      enumerable: true,
      configurable: true,
    })
  }

  // Get cookie header keys
  const cookieHeaderKeys = getCookieHeaderKeys(headersObj)

  // Create and return the ResponseInstance
  return {
    ...response,
    headers: headersRecord,
    cookieHeaderKeys,
    duration,
    status: harResponse.status,
    statusText: harResponse.statusText,
    method,
    path,
    data,
    size,
  }
}

/**
 * Converts a base64 encoded string back to an ArrayBuffer.
 * This is the reverse of arrayBufferToBase64.
 */
const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
  const binaryString = atob(base64)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return bytes.buffer
}
