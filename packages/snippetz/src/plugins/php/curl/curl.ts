import type { Plugin } from '@scalar/types/snippetz'

/**
 * php/curl
 */
export const phpCurl: Plugin = {
  target: 'php',
  client: 'curl',
  title: 'cURL',
  generate(request, configuration) {
    // Defaults
    const normalizedRequest = {
      method: 'GET',
      ...request,
    }

    // Normalization
    normalizedRequest.method = normalizedRequest.method.toUpperCase()

    // Build PHP cURL code parts
    const parts: string[] = []

    // Initialize cURL
    // URL (with query parameters)
    const queryString = normalizedRequest.queryString?.length
      ? '?' +
        normalizedRequest.queryString
          .map((param) => {
            const encodedName = encodeURIComponent(param.name)
            const encodedValue = encodeURIComponent(param.value)
            return `${encodedName}=${encodedValue}`
          })
          .join('&')
      : ''
    const url = `${normalizedRequest.url}${queryString}`
    parts.push(`$ch = curl_init("${url}");`)

    // Method
    if (normalizedRequest.method === 'POST') {
      parts.push('curl_setopt($ch, CURLOPT_POST, true);')
    }

    // Basic Auth
    if (configuration?.auth?.username && configuration?.auth?.password) {
      parts.push(`curl_setopt($ch, CURLOPT_USERPWD, '${configuration.auth.username}:${configuration.auth.password}');`)
    }

    // Headers
    if (normalizedRequest.headers?.length) {
      const headerStrings = normalizedRequest.headers.map((header) => `'${header.name}: ${header.value}'`)
      parts.push(`curl_setopt($ch, CURLOPT_HTTPHEADER, [${headerStrings.join(', ')}]);`)

      // Add encoding option if Accept-Encoding header includes compression
      const acceptEncoding = normalizedRequest.headers.find((header) => header.name.toLowerCase() === 'accept-encoding')
      if (acceptEncoding && /gzip|deflate/.test(acceptEncoding.value)) {
        parts.push("curl_setopt($ch, CURLOPT_ENCODING, '');")
      }
    }

    // Cookies
    if (normalizedRequest.cookies?.length) {
      const cookieString = normalizedRequest.cookies
        .map((cookie) => {
          const encodedName = encodeURIComponent(cookie.name)
          const encodedValue = encodeURIComponent(cookie.value)
          return `${encodedName}=${encodedValue}`
        })
        .join('; ')
      parts.push(`curl_setopt($ch, CURLOPT_COOKIE, '${cookieString}');`)
    }

    // Body
    if (normalizedRequest.postData) {
      if (normalizedRequest.postData.mimeType === 'application/json') {
        // Pretty print JSON data
        if (normalizedRequest.postData.text) {
          try {
            const jsonData = JSON.parse(normalizedRequest.postData.text)
            const prettyJson = JSON.stringify(jsonData, null, 2)
            parts.push(`curl_setopt($ch, CURLOPT_POSTFIELDS, '${prettyJson}');`)
          } catch {
            parts.push(`curl_setopt($ch, CURLOPT_POSTFIELDS, '${normalizedRequest.postData.text}');`)
          }
        }
      } else if (normalizedRequest.postData.mimeType === 'multipart/form-data' && normalizedRequest.postData.params) {
        // Handle multipart form data
        const formData = normalizedRequest.postData.params.reduce((acc, param) => {
          if (param.fileName !== undefined) {
            acc.push(`'${param.name}' => '@${param.fileName}'`)
          } else if (param.value !== undefined) {
            acc.push(`'${param.name}' => '${param.value}'`)
          }
          return acc
        }, [] as string[])

        parts.push(`curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: multipart/form-data']);`)
        parts.push(`curl_setopt($ch, CURLOPT_POSTFIELDS, [${formData.join(', ')}]);`)
      } else if (
        normalizedRequest.postData.mimeType === 'application/x-www-form-urlencoded' &&
        normalizedRequest.postData.params
      ) {
        // Handle URL-encoded form data
        const formData = normalizedRequest.postData.params
          .map((param) => {
            const encodedName = encodeURIComponent(param.name)
            const encodedValue = param.value ? encodeURIComponent(param.value) : ''
            return `${encodedName}=${encodedValue}`
          })
          .join('&')
        parts.push(`curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/x-www-form-urlencoded']);`)
        parts.push(`curl_setopt($ch, CURLOPT_POSTFIELDS, '${formData}');`)
      } else if (normalizedRequest.postData.mimeType === 'application/octet-stream') {
        parts.push(`curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/octet-stream']);`)
        parts.push(`curl_setopt($ch, CURLOPT_POSTFIELDS, '${normalizedRequest.postData.text || ''}');`)
      } else if (normalizedRequest.postData.text) {
        // Try to parse and pretty print if it's JSON, otherwise use raw text
        try {
          const jsonData = JSON.parse(normalizedRequest.postData.text)
          const prettyJson = JSON.stringify(jsonData, null, 2)
          parts.push(`curl_setopt($ch, CURLOPT_POSTFIELDS, '${prettyJson}');`)
        } catch {
          parts.push(`curl_setopt($ch, CURLOPT_POSTFIELDS, '${normalizedRequest.postData.text}');`)
        }
      }
    }

    // Execute and close
    parts.push('curl_exec($ch);')
    parts.push('curl_close($ch);')

    return parts.join('\n')
  },
}
