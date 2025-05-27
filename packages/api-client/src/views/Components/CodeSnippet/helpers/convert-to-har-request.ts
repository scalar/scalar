import type { Operation, RequestExample } from '@scalar/oas-utils/entities/spec'
import { mergeUrls } from '@scalar/oas-utils/helpers'
import type { HarRequest, FormDataParam } from '@scalar/snippetz'

type Props = {
  baseUrl: string | undefined
  body?: RequestExample['body'] | undefined
  cookies: { key: string; value: string; enabled: boolean }[]
  headers: { key: string; value: string; enabled: boolean }[]
  query: { key: string; value: string; enabled: boolean }[]
} & Pick<Operation, 'method' | 'path'>

/**
 * Takes in a regular request object and returns a HAR request
 * We also Titlecase the headers and remove accept header if it's *
 */
export const convertToHarRequest = ({
  baseUrl = '',
  method,
  body,
  path,
  cookies,
  headers,
  query,
}: Props): HarRequest => {
  // Merge the two urls with a failsafe
  const url = mergeUrls(baseUrl, path, undefined, true)

  // Create base HAR request structure
  const harRequest: HarRequest = {
    method: method.toUpperCase(),
    url: url.toString(),
    httpVersion: 'HTTP/1.1',
    headers: [],
    queryString: [],
    cookies: [],
    headersSize: -1,
    bodySize: -1,
  }

  // Handle cookies from Cookie header
  if (cookies.length) {
    harRequest.cookies = cookies
      .filter((c) => c.enabled)
      .map(({ key, value }) => ({
        name: key,
        value,
      }))
  }

  // Convert headers
  if (headers.length) {
    harRequest.headers = headers
      .filter((h) => h.enabled && !(h.key.toLowerCase() === 'accept' && h.value === '*/*'))
      .map(({ key, value }) => ({
        name: key.replace(/\b\w/g, (letter) => letter.toUpperCase()),
        value,
      }))
  }

  // Handle query parameters
  if (query.length) {
    harRequest.queryString = query
      .filter((q) => q.enabled)
      .map(({ key, value }) => ({
        name: key,
        value,
      }))
  }

  // Handle request body if present
  if (body) {
    try {
      const contentType = headers.find((h) => h.key.toLowerCase() === 'content-type')?.value

      // For form-data, convert to object while handling File objects
      if (body.activeBody === 'formData' && body.formData) {
        const params: FormDataParam[] = []

        body.formData.value.forEach(({ key, value, file, enabled }) => {
          if (!enabled) {
            return
          }

          if (file) {
            params.push({
              name: key || 'blob',
              value: 'BINARY',
              fileName: file.name,
              contentType: file.type || 'application/octet-stream',
            })
          } else {
            params.push({
              name: key,
              value,
            })
          }
        })

        // Handle urlencoded form data
        if (body.formData?.encoding === 'urlencoded') {
          harRequest.postData = {
            mimeType: contentType || 'application/x-www-form-urlencoded',
            params,
          }
        } else {
          harRequest.postData = {
            mimeType: contentType || 'multipart/form-data',
            params,
          }
        }
      } else if (body.activeBody === 'raw' && body.raw) {
        // For other content types (JSON, plain text, url-encoded)
        harRequest.postData = {
          mimeType: contentType || 'application/json',
          text: body.raw?.value ?? '',
        }
      }
    } catch (_e) {
      // Invalid request body, leave postData empty
    }
  }

  return harRequest
}
