import type {
  Operation,
  RequestExample,
  Server,
} from '@scalar/oas-utils/entities/spec'
import { combineUrlAndPath } from '@scalar/oas-utils/helpers'
import type { HarRequest } from '@scalar/snippetz'

/**
 * Takes in a regular request object and returns a HAR request
 * We also Titlecase the headers
 */
export const convertToHarRequest = async (
  operation: Operation,
  example: RequestExample,
  server?: Server,
): Promise<HarRequest> => {
  const url = combineUrlAndPath(server?.url ?? '', operation.path)

  // Create base HAR request structure
  const harRequest: HarRequest = {
    method: operation.method.toUpperCase(),
    url: url.toString(),
    httpVersion: 'HTTP/1.1',
    headers: [],
    queryString: [],
    cookies: [],
    headersSize: -1,
    bodySize: -1,
  }
  const { cookies, headers, query } = example.parameters

  // Handle cookies from Cookie header
  if (cookies.length)
    harRequest.cookies = cookies
      .filter((c) => c.enabled)
      .map(({ key, value }) => ({
        name: key,
        value,
      }))

  // Convert headers
  if (headers.length)
    harRequest.headers = headers
      .filter((h) => h.enabled)
      .map(({ key, value }) => ({
        name: key.replace(/\b\w/g, (letter) => letter.toUpperCase()),
        value,
      }))

  // Handle query parameters
  if (query.length)
    harRequest.queryString = query
      .filter((q) => q.enabled)
      .map(({ key, value }) => ({
        name: key,
        value,
      }))

  // Handle request body if present
  if (example.body) {
    try {
      const contentType =
        headers.find((h) => h.key.toLowerCase() === 'content-type')?.value ||
        'application/json'

      // For form-data, convert to object while handling File objects
      if (example.body.activeBody === 'formData' && example.body.formData) {
        const formDataObject: Record<string, any> = {}

        example.body.formData.value.forEach(({ key, value, file }) => {
          if (file) {
            formDataObject[key] = {
              type: 'file',
              text: 'BINARY',
              name: key || 'blob',
              size: file.size,
              fileName: file.name,
              mimeType: file.type || 'application/octet-stream',
            }
          }
          // Handle multiple values for the same key
          else {
            // If key already exists, make an array and append
            if (formDataObject[key]) {
              if (!Array.isArray(formDataObject[key]))
                formDataObject[key] = [formDataObject[key]]

              formDataObject[key].push(value)
            }
            // Otherwise just set the key
            else {
              formDataObject[key] = value
            }
          }
        })

        // Handle urlencoded form data
        if (example.body.formData?.encoding === 'urlencoded') {
          harRequest.postData = {
            mimeType: contentType,
            text: new URLSearchParams(formDataObject).toString(),
          }
        } else {
          harRequest.postData = {
            mimeType: contentType,
            text: JSON.stringify(formDataObject),
          }
        }
      } else if (example.body.activeBody === 'raw' && example.body.raw) {
        // For other content types (JSON, plain text, url-encoded)
        harRequest.postData = {
          mimeType: contentType,
          text: example.body.raw?.value ?? '',
        }
      }
    } catch (e) {
      // Invalid request body, leave postData empty
    }
  }

  return harRequest
}
