import type { Plugin } from '@scalar/types/snippetz'

/**
 * shell/curl
 */
export const shellCurl: Plugin = {
  target: 'shell',
  client: 'curl',
  title: 'Curl',
  generate(request, configuration) {
    // Defaults
    const normalizedRequest = {
      method: 'GET',
      ...request,
    }

    // Normalization
    normalizedRequest.method = normalizedRequest.method.toUpperCase()

    // Build curl command parts
    const parts: string[] = ['curl']

    // URL (quote if has query parameters or special characters)
    const queryString = normalizedRequest.queryString?.length
      ? '?' +
        normalizedRequest.queryString
          .map((param) => {
            // Ensure both name and value are fully URI encoded
            const encodedName = encodeURIComponent(param.name)
            const encodedValue = encodeURIComponent(param.value)
            return `${encodedName}=${encodedValue}`
          })
          .join('&')
      : ''
    const url = `${normalizedRequest.url}${queryString}`
    const hasSpecialChars = /[\s<>[\]{}|\\^%$]/.test(url)
    const urlPart = queryString || hasSpecialChars ? `'${url}'` : url
    parts[0] = `curl ${urlPart}`

    // Method
    if (normalizedRequest.method !== 'GET') {
      parts.push(`--request ${normalizedRequest.method}`)
    }

    // Basic Auth
    if (configuration?.auth?.username && configuration?.auth?.password) {
      parts.push(`--user '${configuration.auth.username}:${configuration.auth.password}'`)
    }

    // Headers
    if (normalizedRequest.headers?.length) {
      normalizedRequest.headers.forEach((header) => {
        parts.push(`--header '${header.name}: ${header.value}'`)
      })

      // Add compressed flag if Accept-Encoding header includes compression
      const acceptEncoding = normalizedRequest.headers.find((header) => header.name.toLowerCase() === 'accept-encoding')
      if (acceptEncoding && /gzip|deflate/.test(acceptEncoding.value)) {
        parts.push('--compressed')
      }
    }

    // Cookies
    if (normalizedRequest.cookies?.length) {
      const cookieString = normalizedRequest.cookies
        .map((cookie) => {
          // Encode both cookie name and value to handle special characters
          const encodedName = encodeURIComponent(cookie.name)
          const encodedValue = encodeURIComponent(cookie.value)
          return `${encodedName}=${encodedValue}`
        })
        .join('; ')
      parts.push(`--cookie '${cookieString}'`)
    }

    // Body
    if (normalizedRequest.postData) {
      if (normalizedRequest.postData.mimeType === 'application/json') {
        // Pretty print JSON data
        if (normalizedRequest.postData.text) {
          try {
            const jsonData = JSON.parse(normalizedRequest.postData.text)
            const prettyJson = JSON.stringify(jsonData, null, 2)
            parts.push(`--data '${prettyJson}'`)
          } catch {
            // If JSON parsing fails, use the original text
            parts.push(`--data '${normalizedRequest.postData.text}'`)
          }
        }
      } else if (normalizedRequest.postData.mimeType === 'application/octet-stream') {
        parts.push(`--data-binary '${normalizedRequest.postData.text}'`)
      } else if (
        normalizedRequest.postData.mimeType === 'application/x-www-form-urlencoded' &&
        normalizedRequest.postData.params
      ) {
        // Handle URL-encoded form data
        normalizedRequest.postData.params.forEach((param) => {
          parts.push(`--data-urlencode '${encodeURIComponent(param.name)}=${param.value}'`)
        })
      } else if (normalizedRequest.postData.mimeType === 'multipart/form-data' && normalizedRequest.postData.params) {
        // Handle multipart form data
        normalizedRequest.postData.params.forEach((param) => {
          if (param.fileName !== undefined) {
            parts.push(`--form '${param.name}=@${param.fileName}'`)
          } else {
            parts.push(`--form '${param.name}=${param.value}'`)
          }
        })
      } else {
        // Try to parse and pretty print if it's JSON, otherwise use raw text
        try {
          const jsonData = JSON.parse(normalizedRequest.postData.text ?? '')
          const prettyJson = JSON.stringify(jsonData, null, 2)
          parts.push(`--data '${prettyJson}'`)
        } catch {
          parts.push(`--data '${normalizedRequest.postData.text}'`)
        }
      }
    }

    return parts.join(' \\\n  ')
  },
}
