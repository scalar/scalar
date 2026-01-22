import type { HarRequest } from '@scalar/snippetz'

export type FetchRequestToHarProps = {
  /** The Fetch API Request object to convert */
  request: Request
  /**
   * Whether to include the request body in the HAR postData.
   * Note: Reading the body consumes it, so the request will be cloned automatically.
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
 * Converts a Fetch API Request object to HAR (HTTP Archive) Request format.
 *
 * This function transforms a standard JavaScript Fetch API Request into the
 * HAR format, which is useful for:
 * - Recording HTTP requests for replay or analysis
 * - Creating request fixtures from real API calls
 * - Debugging and monitoring HTTP traffic
 * - Storing request history in a standard format
 * - Generating API documentation from real requests
 *
 * The conversion handles:
 * - Request method and URL
 * - Headers extraction (excluding sensitive headers if needed)
 * - Query parameters extraction from URL
 * - Cookie extraction from headers
 * - Request body reading (with automatic cloning to preserve the original)
 * - Content-Type detection and MIME type extraction
 * - Size calculations for headers and body
 * - Form data bodies are converted to params array
 * - Other body types are read as text
 *
 * Note: The Fetch API does not expose the HTTP version, so it defaults to HTTP/1.1
 * unless specified otherwise.
 *
 * @see https://w3c.github.io/web-performance/specs/HAR/Overview.html
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Request
 *
 * @example
 * const request = new Request('https://api.example.com/users', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({ name: 'John' })
 * })
 * const harRequest = await fetchRequestToHar({ request })
 * console.log(harRequest.method) // 'POST'
 * console.log(harRequest.postData?.text) // '{"name":"John"}'
 */
export const fetchRequestToHar = async ({
  request,
  includeBody = true,
  httpVersion = 'HTTP/1.1',
}: FetchRequestToHarProps): Promise<HarRequest> => {
  // Clone the request to avoid consuming the body if we need to read it
  const clonedRequest = includeBody ? request.clone() : request

  // Extract headers as an array
  const headers: { name: string; value: string }[] = []
  const cookies: { name: string; value: string }[] = []

  request.headers.forEach((value, name) => {
    headers.push({ name, value })

    // Parse Cookie headers into cookies array
    if (name.toLowerCase() === 'cookie') {
      const parsedCookies = parseCookieHeader(value)
      cookies.push(...parsedCookies)
    }
  })

  // Extract query string from URL
  const url = new URL(request.url)
  const queryString: { name: string; value: string }[] = []

  url.searchParams.forEach((value, name) => {
    queryString.push({ name, value })
  })

  // Read the request body if requested
  let bodyText = ''
  let bodySize = -1
  const mimeType = request.headers.get('content-type')?.split(';')[0]?.trim() ?? 'text/plain'
  let params: { name: string; value: string }[] | undefined

  if (includeBody && request.body) {
    try {
      // Check if this is form data
      const isFormData = ['multipart/form-data', 'application/x-www-form-urlencoded'].some((type) =>
        mimeType.startsWith(type),
      )

      console.log('isFormData', isFormData, mimeType)

      if (isFormData) {
        console.log('reading as FormData')

        // For URL-encoded form data, parse manually
        if (mimeType.startsWith('application/x-www-form-urlencoded')) {
          console.log('parsing URL-encoded form data')
          const arrayBuffer = await clonedRequest.arrayBuffer()
          bodySize = arrayBuffer.byteLength
          const text = new TextDecoder().decode(arrayBuffer)

          try {
            // Parse URL-encoded data
            params = []
            const urlParams = new URLSearchParams(text)
            urlParams.forEach((value, name) => {
              params?.push({ name, value })
            })
            console.log('params', params)
          } catch (error) {
            console.log('URL-encoded parsing failed, using text instead', error)
            // If URLSearchParams parsing fails, just use the text
            bodyText = text
          }
        }
        // For multipart form data, try using the native formData() method
        else {
          // Clone again for fallback in case FormData parsing fails
          const formDataRequest = clonedRequest.clone()

          try {
            const formData = await formDataRequest.formData()
            params = []
            bodySize = 0

            formData.forEach((value, name) => {
              // Handle File objects
              if (value instanceof File) {
                const fileValue = `@${value.name}`
                params?.push({ name, value: fileValue })
                bodySize += name.length + fileValue.length
              } else {
                const stringValue = String(value)
                params?.push({ name, value: stringValue })
                bodySize += name.length + stringValue.length
              }
            })
            console.log('params', params)
          } catch (error) {
            console.log('FormData parsing failed, falling back to text', error)
            // If FormData parsing fails, fall back to text using the non-consumed clone
            const arrayBuffer = await clonedRequest.arrayBuffer()
            bodySize = arrayBuffer.byteLength
            bodyText = new TextDecoder().decode(arrayBuffer)
          }
        }
      } else {
        console.log('reading as text')
        // For non-form data, read as text
        const arrayBuffer = await clonedRequest.arrayBuffer()
        bodySize = arrayBuffer.byteLength
        bodyText = new TextDecoder().decode(arrayBuffer)
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

  // Create the HAR request object
  const harRequest: HarRequest = {
    method: request.method,
    url: request.url,
    httpVersion,
    headers,
    cookies,
    queryString,
    headersSize,
    bodySize,
  }

  // Add postData if body is present
  if (params) {
    harRequest.postData = {
      mimeType,
      params,
    }
  } else if (bodyText) {
    harRequest.postData = {
      mimeType,
      text: bodyText,
    }
  }

  return harRequest
}

/**
 * Parses a Cookie header value into an array of cookie objects.
 * Cookie format: name1=value1; name2=value2
 */
const parseCookieHeader = (cookieValue: string): { name: string; value: string }[] => {
  const cookies: { name: string; value: string }[] = []
  const parts = cookieValue.split(';')

  for (const part of parts) {
    const trimmedPart = part.trim()
    const equalIndex = trimmedPart.indexOf('=')

    if (equalIndex === -1) {
      continue
    }

    const name = trimmedPart.substring(0, equalIndex).trim()
    const value = trimmedPart.substring(equalIndex + 1).trim()

    cookies.push({ name, value })
  }

  return cookies
}
