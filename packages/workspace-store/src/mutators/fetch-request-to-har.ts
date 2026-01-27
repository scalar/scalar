import type { HarRequest } from '@scalar/snippetz'

type FetchRequestToHarProps = {
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
  /**
   * The maximum size of the request body to include in the HAR postData.
   * @default 1MB
   */
  bodySizeLimit?: number
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
  // Default to 1MB
  bodySizeLimit = 1048576,
}: FetchRequestToHarProps): Promise<HarRequest> => {
  // Extract query string from URL
  const url = new URL(request.url)

  // Extract the query strings from the URL
  const queryString = Array.from(url.searchParams.entries()).map(([name, value]) => ({ name, value }))

  // Extract the headers from the request
  const { headers, headersSize, cookies } = processRequestHeaders(request)

  // Extract the MIME type from the request headers
  const mimeType = request.headers.get('content-type')?.split(';')[0]?.trim() ?? 'text/plain'

  // Read the request body if requested
  const bodyDetails = await (async () => {
    if (includeBody && request.body) {
      const details = await processRequestBody(request.clone())
      if (details.size <= bodySizeLimit) {
        return details
      }
    }
    return { text: '', size: -1 }
  })()

  // Create the HAR request object
  const harRequest: HarRequest = {
    method: request.method,
    url: request.url,
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

const processRequestBody = async (request: Request) => {
  const formData = await tryGetRequestFormData(request.clone())
  if (formData) {
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
  // Skip binary bodies
  if (request.headers.get('content-type')?.includes('application/octet-stream')) {
    return { text: '', size: -1 }
  }

  // Read the request body as text
  const arrayBuffer = await request.arrayBuffer()
  const size = arrayBuffer.byteLength
  return { size, text: new TextDecoder().decode(arrayBuffer) }
}

async function tryGetRequestFormData(request: Request): Promise<FormData | null> {
  if (typeof request.formData !== 'function') {
    return null
  }

  if (request.bodyUsed) {
    return null
  }

  const contentType = request.headers.get('content-type') ?? ''
  if (!contentType.includes('multipart/form-data') && !contentType.includes('application/x-www-form-urlencoded')) {
    return null
  }

  try {
    return await request.formData()
  } catch {
    return null
  }
}

const processRequestHeaders = (request: Request) => {
  return Array.from(request.headers.entries()).reduce<{
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
