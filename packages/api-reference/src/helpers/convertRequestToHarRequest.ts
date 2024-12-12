import type { HarRequest } from '@scalar/snippetz'

/**
 * Takes in a regular request object and returns a HAR request
 * We also Titlecase the headers
 */
export const convertRequestToHarRequest = async (
  request: Request,
): Promise<HarRequest> => {
  const url = new URL(request.url)

  // Prevent duplication of query string
  const query = Array.from(url.searchParams.entries())
  url.search = ''

  // Create base HAR request structure
  const harRequest: HarRequest = {
    method: request.method.toUpperCase(),
    url: url.toString(),
    httpVersion: 'HTTP/1.1',
    headers: [],
    queryString: [],
    cookies: [],
    headersSize: -1,
    bodySize: -1,
  }

  // Handle cookies from Cookie header
  const cookieHeader = request.headers.get('cookie')
  if (cookieHeader) {
    harRequest.cookies = cookieHeader.split(';').map((cookie) => {
      const [name, value] = cookie.trim().split('=')
      return { name, value }
    })
  }

  // Convert headers
  if (request.headers) {
    harRequest.headers = Array.from(request.headers.entries()).map(
      ([name, value]) => ({
        name: name.replace(/\b\w/g, (letter) => letter.toUpperCase()),
        value,
      }),
    )
  }

  // Handle query parameters
  try {
    harRequest.queryString = query.map(([name, value]) => ({
      name,
      value,
    }))

    // Prevent duplication of query params
    url.search = ''
  } catch (e) {
    // Invalid URL, leave queryString empty
  }

  // Handle request body if present
  if (request.body) {
    try {
      const contentType =
        request.headers.get('content-type') || 'application/json'

      // For form-data, convert to object while handling File objects
      if (contentType.includes('multipart/form-data')) {
        const formData = await request.formData()
        const formDataObject: Record<string, any> = {}

        formData.forEach((value, key) => {
          const isBlob = value instanceof Blob
          const isFile = value instanceof File

          if (isFile || isBlob) {
            formDataObject[key] = {
              type: 'file',
              text: 'BINARY',
              name: 'name' in value ? value.name : 'blob',
              size: value.size,
              mimeType: value.type || 'application/octet-stream',
            }
          }
          // Handle multiple values for the same key
          else {
            const values = formData.getAll(key)
            if (values.length > 1) {
              formDataObject[key] = values
            } else {
              formDataObject[key] = values[0]
            }
          }
        })

        harRequest.postData = {
          mimeType: contentType,
          text: JSON.stringify(formDataObject),
        }
      } else {
        // For other content types (JSON, plain text, url-encoded)
        harRequest.postData = {
          mimeType: contentType,
          text: await request.text(),
        }
      }
    } catch (e) {
      // Invalid request body, leave postData empty
    }
  }

  return harRequest
}
