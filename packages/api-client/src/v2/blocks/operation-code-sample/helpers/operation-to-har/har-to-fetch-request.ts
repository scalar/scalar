import type { Request as HarRequest } from 'har-format'

export type HarToFetchRequestProps = {
  /** The HAR Request object to convert */
  harRequest: HarRequest
}

/**
 * Converts a HAR (HTTP Archive) Request to a Fetch API Request object.
 *
 * This function is the reverse of fetchRequestToHar - it takes a HAR request
 * and converts it into a standard JavaScript Fetch API Request object.
 *
 * The conversion handles:
 * - Request method and URL reconstruction
 * - Headers reconstruction from HAR headers array
 * - Body decoding from base64 (if encoded) or plain text back to original content
 * - Content-Type and other header restoration
 * - Query parameters (already embedded in the URL)
 *
 * Use cases:
 * - Replaying recorded HTTP requests
 * - Creating mock requests from HAR files
 * - Testing with fixtures
 * - Request caching and restoration
 * - Re-executing historical API calls
 *
 * Note: The Fetch API Request object does not support setting the HTTP version,
 * so that information from the HAR is not preserved in the returned Request.
 * Query parameters are expected to be already part of the URL in the HAR.
 *
 * @see https://w3c.github.io/web-performance/specs/HAR/Overview.html
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Request
 *
 * @example
 * const harRequest = { method: 'POST', url: 'https://api.example.com', ... }
 * const request = harToFetchRequest({ harRequest })
 * const response = await fetch(request)
 */
export const harToFetchRequest = ({ harRequest }: HarToFetchRequestProps): Request => {
  // Reconstruct headers from HAR headers array
  const headers = new Headers()
  for (const header of harRequest.headers) {
    headers.append(header.name, header.value)
  }

  // Decode the body from postData if it exists
  let body: ArrayBuffer | null = null

  if (harRequest.postData?.text) {
    // Check if the postData.text is base64 encoded
    // In fetchRequestToHar, we always encode as base64, but we should handle both cases
    const isBase64 = isLikelyBase64(harRequest.postData.text)

    if (isBase64) {
      // Decode from base64 to ArrayBuffer
      body = base64ToArrayBuffer(harRequest.postData.text)
    } else {
      // If not base64 encoded, treat as plain text
      body = new TextEncoder().encode(harRequest.postData.text).buffer
    }
  }

  // Create the Fetch Request object
  // For GET and HEAD requests, body must be null
  const requestInit: RequestInit = {
    method: harRequest.method,
    headers,
  }

  // Only add body for methods that support it
  if (body && !['GET', 'HEAD'].includes(harRequest.method.toUpperCase())) {
    requestInit.body = body
  }

  const request = new Request(harRequest.url, requestInit)

  return request
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

/**
 * Attempts to detect if a string is likely base64 encoded.
 * This is a heuristic check, not perfect but works for most cases.
 */
const isLikelyBase64 = (str: string): boolean => {
  if (!str || str.length === 0) {
    return false
  }

  // Base64 strings only contain these characters
  const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/

  // Check if it matches base64 pattern
  if (!base64Regex.test(str)) {
    return false
  }

  // Additional heuristic: base64 strings typically don't contain common JSON/XML/HTML patterns
  // If we see these, it is likely plain text
  const plainTextIndicators = ['{', '<', '[', 'http://', 'https://', ' ']
  for (const indicator of plainTextIndicators) {
    if (str.includes(indicator)) {
      return false
    }
  }

  // If it passes both checks, it is likely base64
  return true
}
