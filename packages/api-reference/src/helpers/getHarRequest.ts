import type { HarRequest } from 'httpsnippet-lite'

/** Takes in a regular request object and returns a HAR request */
export const getHarRequest = (request: Request): HarRequest => {
  // Create base HAR request structure
  const harRequest: HarRequest = {
    method: request.method,
    url: request.url,
    httpVersion: 'HTTP/1.1',
    headers: [],
    queryString: [],
    cookies: [],
    headersSize: -1,
    bodySize: -1,
  }

  // Convert headers
  if (request.headers) {
    harRequest.headers = Array.from(request.headers.entries()).map(
      ([name, value]) => ({
        name,
        value,
      }),
    )
  }

  // Handle query parameters
  try {
    const url = new URL(request.url)
    harRequest.queryString = Array.from(url.searchParams.entries()).map(
      ([name, value]) => ({
        name,
        value,
      }),
    )
  } catch (e) {
    // Invalid URL, leave queryString empty
  }

  // Handle request body if present
  if (request.body) {
    harRequest.postData = {
      mimeType: request.headers.get('content-type') || 'application/json',
      text:
        typeof request.body === 'string'
          ? request.body
          : JSON.stringify(request.body),
    }
  }

  return harRequest
}
