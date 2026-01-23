import type { HarRequest } from '@scalar/snippetz'

type HarToFetchRequestProps = {
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
 * - Cookies conversion to Cookie header
 * - Form data (params) conversion to FormData or URLSearchParams
 * - Body decoding
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
  const headers = buildHeaders(harRequest)
  const body = buildBody(harRequest.postData)

  return new Request(harRequest.url, {
    method: harRequest.method,
    headers,
    body,
  })
}

/**
 * Builds Headers object from HAR request headers and cookies.
 */
const buildHeaders = (harRequest: HarRequest): Headers => {
  const headers = new Headers()

  // Add all headers from HAR
  harRequest.headers.forEach(({ name, value }) => {
    headers.append(name, value)
  })

  // Convert cookies to Cookie header
  if (harRequest.cookies?.length) {
    const cookieString = harRequest.cookies.map(({ name, value }) => `${name}=${value}`).join('; ')
    headers.append('Cookie', cookieString)
  }

  return headers
}

/**
 * Builds request body from HAR postData.
 * Returns FormData for multipart forms, URLSearchParams for URL-encoded forms,
 * or encoded text for other content types.
 */
const buildBody = (postData: HarRequest['postData']): BodyInit | null => {
  if (!postData) {
    return null
  }

  const { params, text, mimeType } = postData

  // Handle form data parameters
  if (params?.length) {
    const isMultipart = mimeType?.includes('multipart/form-data')
    const form = isMultipart ? new FormData() : new URLSearchParams()

    params.forEach(({ name, value }) => {
      form.append(name, value || '')
    })

    return form
  }

  // Handle text body
  if (text) {
    return new TextEncoder().encode(text)
  }

  return null
}
