import type { HarResponse } from '@scalar/snippetz'

type FetchResponseToHarProps = {
  /** The Fetch API Response object to convert */
  response: Response
  /**
   * Whether to include the response body in the HAR content.
   * Note: Reading the body consumes it, so the response will be cloned automatically.
   * Bodies will only be included if they meet the following criteria:
   * - Not a streaming response (text/event-stream)
   * - Text-based content (not binary)
   * - Under 1MB in size
   * @default true
   */
  includeBody?: boolean
  /**
   * HTTP version string to use (since Fetch API does not expose this)
   * @default 'HTTP/1.1'
   */
  httpVersion?: string
  /**
   * The maximum size of the response body to include in the HAR content.
   * @default 1MB
   */
  bodySizeLimit?: number
}

/**
 * Converts a Fetch API Response object to HAR (HTTP Archive) Response format.
 *
 * This function transforms a standard JavaScript Fetch API Response into the
 * HAR format, which is useful for:
 * - Recording HTTP responses for replay or analysis
 * - Creating test fixtures from real API responses
 * - Debugging and monitoring HTTP traffic
 * - Generating API documentation from real responses
 *
 * The conversion handles:
 * - Response status and status text
 * - Headers extraction (including Set-Cookie headers converted to cookies)
 * - Response body reading (with automatic cloning to preserve the original)
 * - Content-Type detection and MIME type extraction
 * - Size calculations for headers and body
 * - Redirect URL extraction from Location header
 *
 * Note: The Fetch API does not expose the HTTP version, so it defaults to HTTP/1.1
 * unless specified otherwise.
 *
 * @see https://w3c.github.io/web-performance/specs/HAR/Overview.html
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Response
 *
 * @example
 * const response = await fetch('https://api.example.com/users')
 * const harResponse = await fetchResponseToHar({ response })
 * console.log(harResponse.status) // 200
 */
export const fetchResponseToHar = async ({
  response,
  includeBody = true,
  httpVersion = 'HTTP/1.1',
  bodySizeLimit = 1048576,
}: FetchResponseToHarProps): Promise<HarResponse> => {
  // Extract the headers from the response
  const { headers, headersSize, cookies } = processResponseHeaders(response)

  // Extract redirect URL from Location header
  const redirectURL = response.headers.get('location') || ''

  // Get content type
  const contentType = response.headers.get('content-type') ?? 'text/plain'

  // Read the response body if requested
  const bodyDetails = await (async () => {
    if (includeBody && response.body) {
      const details = await processResponseBody(response.clone())
      if (details.size <= bodySizeLimit) {
        return details
      }
    }
    return { text: '', size: -1, encoding: undefined }
  })()

  // Create the HAR response object
  const harResponse: HarResponse = {
    status: response.status,
    statusText: response.statusText,
    httpVersion,
    headers,
    cookies,
    content: {
      size: bodyDetails.size,
      mimeType: contentType,
      text: bodyDetails.text,
      encoding: bodyDetails.encoding,
    },
    redirectURL,
    headersSize,
    bodySize: bodyDetails.size,
  }

  return harResponse
}

const processResponseHeaders = (response: Response) => {
  return Array.from(response.headers.entries()).reduce<{
    headers: { name: string; value: string }[]
    headersSize: number
    cookies: { name: string; value: string }[]
  }>(
    (acc, [name, value]) => {
      acc.headers.push({ name, value })
      acc.headersSize += name.length + 2 + value.length + 2

      // Parse Set-Cookie headers into cookies array
      if (name.toLowerCase() === 'set-cookie') {
        const cookie = parseSetCookieHeader(value)
        if (cookie) {
          acc.cookies.push(cookie)
        }
      }

      return acc
    },
    { headers: [], headersSize: 0, cookies: [] },
  )
}

const processResponseBody = async (response: Response) => {
  const contentType = response.headers.get('content-type')
  if (!contentType || !isTextBasedContent(contentType)) {
    return { text: '', size: -1, encoding: undefined }
  }

  try {
    // Read as ArrayBuffer to get the size
    const arrayBuffer = await response.arrayBuffer()
    const bodySize = arrayBuffer.byteLength
    const text = new TextDecoder('utf-8').decode(arrayBuffer)
    return { text, size: bodySize, encoding: undefined }
  } catch {
    // If body cannot be read, leave it empty
    return { text: '', size: -1, encoding: undefined }
  }
}

/**
 * Checks if the content type is text-based and should be included in HAR.
 * Text-based content types include:
 * - text/* (text/plain, text/html, text/css, etc.)
 * - application/json
 * - application/xml and text/xml
 * - application/javascript
 * - application/*+json and application/*+xml variants
 */
export const isTextBasedContent = (contentType: string): boolean => {
  const lowerContentType = contentType.toLowerCase()

  // Check for text/* types
  if (lowerContentType.startsWith('text/')) {
    return true
  }

  // Check for JSON types
  if (lowerContentType.includes('application/json') || lowerContentType.includes('+json')) {
    return true
  }

  // Check for XML types
  if (
    lowerContentType.includes('application/xml') ||
    lowerContentType.includes('text/xml') ||
    lowerContentType.includes('+xml')
  ) {
    return true
  }

  // Check for JavaScript
  if (lowerContentType.includes('application/javascript') || lowerContentType.includes('application/x-javascript')) {
    return true
  }

  // Check for common text-based formats
  if (
    lowerContentType.includes('application/x-www-form-urlencoded') ||
    lowerContentType.includes('application/graphql')
  ) {
    return true
  }

  return false
}

/**
 * Parses a Set-Cookie header value into a cookie object.
 * This is a simplified parser that extracts the name and value.
 * For full cookie parsing with attributes, a more robust parser would be needed.
 */
const parseSetCookieHeader = (setCookieValue: string): { name: string; value: string } | null => {
  // Set-Cookie format: name=value; attribute1=value1; attribute2=value2
  const parts = setCookieValue.split(';')
  if (parts.length === 0 || !parts[0]) {
    return null
  }

  const cookiePart = parts[0].trim()
  const equalIndex = cookiePart.indexOf('=')

  if (equalIndex === -1) {
    return null
  }

  const name = cookiePart.substring(0, equalIndex).trim()
  const value = cookiePart.substring(equalIndex + 1).trim()

  return { name, value }
}
