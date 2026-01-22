import type { HarResponse } from '@scalar/snippetz'

/** Maximum response body size to include in HAR (1MB) */
const MAX_BODY_SIZE = 1048576

export type FetchResponseToHarProps = {
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
}: FetchResponseToHarProps): Promise<HarResponse> => {
  // Clone the response to avoid consuming the body if we need to read it
  const clonedResponse = includeBody ? response.clone() : response

  // Extract headers as an array
  const headers: { name: string; value: string }[] = []
  const cookies: { name: string; value: string }[] = []

  response.headers.forEach((value, name) => {
    headers.push({ name, value })

    // Parse Set-Cookie headers into cookies array
    if (name.toLowerCase() === 'set-cookie') {
      const cookie = parseCookie(value)
      if (cookie) {
        cookies.push(cookie)
      }
    }
  })

  // Extract redirect URL from Location header
  const redirectURL = response.headers.get('location') || ''

  // Get content type
  const contentType = response.headers.get('content-type') || 'application/octet-stream'

  // Read the response body if requested
  let bodyText = ''
  let bodySize = -1
  let encoding: 'base64' | undefined

  if (includeBody) {
    try {
      // Skip streaming responses
      if (contentType.startsWith('text/event-stream')) {
        bodyText = ''
        bodySize = -1
      } else {
        // Read as ArrayBuffer to get the size
        const arrayBuffer = await clonedResponse.arrayBuffer()
        bodySize = arrayBuffer.byteLength

        // Only include body if it's under 1MB and is text content
        const shouldIncludeBody = bodySize < MAX_BODY_SIZE && isTextBasedContent(contentType)

        if (shouldIncludeBody) {
          // Decode as text for text-based content
          const decoder = new TextDecoder('utf-8')
          bodyText = decoder.decode(arrayBuffer)
          // No encoding needed for plain text
          encoding = undefined
        } else {
          // Do not include binary or large bodies
          bodyText = ''
        }
      }
    } catch {
      // If body cannot be read, leave it empty
      bodyText = ''
      bodySize = -1
    }
  }

  // Calculate headers size
  let headersSize = 0
  for (const header of headers) {
    // name + ": " + value + "\r\n"
    headersSize += header.name.length + 2 + header.value.length + 2
  }

  // Create the HAR response object
  const harResponse: HarResponse = {
    status: response.status,
    statusText: response.statusText,
    httpVersion,
    headers,
    cookies,
    content: {
      size: bodySize,
      mimeType: contentType,
      text: bodyText,
      encoding,
    },
    redirectURL,
    headersSize,
    bodySize,
  }

  return harResponse
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
const isTextBasedContent = (contentType: string): boolean => {
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
const parseCookie = (setCookieValue: string): { name: string; value: string } | null => {
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
