import type { Plugin } from '@scalar/types/snippetz'

import { escapeSingleQuotes } from '@/libs/shell'

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
      const authValue = escapeSingleQuotes(`${configuration.auth.username}:${configuration.auth.password}`)
      parts.push(`--user '${authValue}'`)
    }

    // Headers
    if (normalizedRequest.headers?.length) {
      normalizedRequest.headers.forEach((header) => {
        const headerValue = escapeSingleQuotes(`${header.name}: ${header.value}`)
        parts.push(`--header '${headerValue}'`)
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
      const escapedCookieString = escapeSingleQuotes(cookieString)
      parts.push(`--cookie '${escapedCookieString}'`)
    }

    // Body
    if (normalizedRequest.postData) {
      if (normalizedRequest.postData.mimeType === 'application/json') {
        // Pretty print JSON data
        if (normalizedRequest.postData.text) {
          try {
            const jsonData = JSON.parse(normalizedRequest.postData.text)
            const prettyJson = JSON.stringify(jsonData, null, 2)
            const escapedJson = escapeSingleQuotes(prettyJson)
            parts.push(`--data '${escapedJson}'`)
          } catch {
            // If JSON parsing fails, use the original text
            const escapedText = escapeSingleQuotes(normalizedRequest.postData.text ?? '')
            parts.push(`--data '${escapedText}'`)
          }
        }
      } else if (normalizedRequest.postData.mimeType === 'application/octet-stream') {
        const escapedText = escapeSingleQuotes(normalizedRequest.postData.text ?? '')
        parts.push(`--data-binary '${escapedText}'`)
      } else if (
        normalizedRequest.postData.mimeType === 'application/x-www-form-urlencoded' &&
        normalizedRequest.postData.params
      ) {
        // Handle URL-encoded form data
        normalizedRequest.postData.params.forEach((param) => {
          const escapedValue = escapeSingleQuotes(param.value ?? '')
          const encodedName = encodeURIComponent(param.name)
          const escapedName = escapeSingleQuotes(encodedName)
          parts.push(`--data-urlencode '${escapedName}=${escapedValue}'`)
        })
      } else if (normalizedRequest.postData.mimeType === 'multipart/form-data' && normalizedRequest.postData.params) {
        // Handle multipart form data
        normalizedRequest.postData.params.forEach((param) => {
          const escapedName = escapeSingleQuotes(param.name)
          if (param.fileName !== undefined) {
            const escapedFileName = escapeSingleQuotes(param.fileName)
            parts.push(`--form '${escapedName}=@${escapedFileName}'`)
          } else {
            const escapedValue = escapeSingleQuotes(param.value ?? '')
            parts.push(`--form '${escapedName}=${escapedValue}'`)
          }
        })
      } else {
        // Try to parse and pretty print if it's JSON, otherwise use raw text
        try {
          const jsonData = JSON.parse(normalizedRequest.postData.text ?? '')
          const prettyJson = JSON.stringify(jsonData, null, 2)
          const escapedJson = escapeSingleQuotes(prettyJson)
          parts.push(`--data '${escapedJson}'`)
        } catch {
          const escapedText = escapeSingleQuotes(normalizedRequest.postData.text ?? '')
          parts.push(`--data '${escapedText}'`)
        }
      }
    }

    return parts.join(' \\\n  ')
  },
}
