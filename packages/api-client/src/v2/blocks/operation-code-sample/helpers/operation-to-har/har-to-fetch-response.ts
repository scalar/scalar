import type { Response as HarResponse } from 'har-format'

export type HarToFetchResponseProps = {
  /** The HAR Response object to convert */
  harResponse: HarResponse
  /** Optional URL to set on the Response object */
  url?: string
}

/**
 * Converts a HAR (HTTP Archive) Response back to a Fetch API Response object.
 *
 * This function is the reverse of fetchResponseToHar - it takes a HAR response
 * and converts it back into a standard JavaScript Fetch API Response object.
 *
 * The conversion handles:
 * - Status code and status text restoration
 * - Headers reconstruction from HAR headers array
 * - Body decoding from base64 (if encoded) back to original content
 * - Content-Type and other header restoration
 * - URL property setting (if provided)
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
 * const response = harToFetchResponse({ harResponse, url: 'https://api.example.com' })
 * const data = await response.json()
 * console.log(response.url) // 'https://api.example.com'
 */
export const harToFetchResponse = ({ harResponse, url }: HarToFetchResponseProps): Response => {
  // Reconstruct headers from HAR headers array
  const headers = new Headers()
  for (const header of harResponse.headers) {
    headers.append(header.name, header.value)
  }

  // Decode the body from base64 if it is encoded
  let body: ArrayBuffer | null = null

  if (harResponse.content.text) {
    if (harResponse.content.encoding === 'base64') {
      // Decode from base64 to ArrayBuffer
      body = base64ToArrayBuffer(harResponse.content.text)
    } else {
      // If not base64 encoded, treat as plain text
      body = new TextEncoder().encode(harResponse.content.text).buffer
    }
  }

  // Create the Fetch Response object
  const response = new Response(body, {
    status: harResponse.status,
    statusText: harResponse.statusText,
    headers,
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

  return response
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
