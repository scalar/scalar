import type { Plugin } from '@scalar/types/snippetz'

import { objectToString } from '@/libs/php'

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
    let hasMultipartMimeBody = false

    // Initialize cURL
    // URL (with query parameters)
    const queryString = normalizedRequest.queryString?.length
      ? '?' +
        normalizedRequest.queryString
          .map((param) => {
            return `${param.name}=${param.value}`
          })
          .join('&')
      : ''
    const url = `${normalizedRequest.url}${queryString}`
    parts.push(`$ch = curl_init("${url}");`)
    parts.push('')

    // Method
    if (normalizedRequest.method === 'POST') {
      parts.push('curl_setopt($ch, CURLOPT_POST, true);')
    }

    // Basic Auth
    if (configuration?.auth?.username && configuration?.auth?.password) {
      parts.push(`curl_setopt($ch, CURLOPT_USERPWD, '${configuration.auth.username}:${configuration.auth.password}');`)
    }

    // Collect all headers to emit once, avoiding duplicate CURLOPT_HTTPHEADER calls.
    // Body processing may add a Content-Type header, so we determine it first.
    const allHeaders: Array<{ name: string; value: string }> = [...(normalizedRequest.headers || [])]

    // Helper to add Content-Type header if not already present
    const hasContentType = () => allHeaders.some((h) => h.name.toLowerCase() === 'content-type')

    // Determine Content-Type from body before emitting headers
    if (normalizedRequest.postData) {
      if (
        normalizedRequest.postData.mimeType === 'application/x-www-form-urlencoded' &&
        normalizedRequest.postData.params &&
        !hasContentType()
      ) {
        allHeaders.push({ name: 'Content-Type', value: 'application/x-www-form-urlencoded' })
      } else if (normalizedRequest.postData.mimeType === 'application/octet-stream' && !hasContentType()) {
        allHeaders.push({ name: 'Content-Type', value: 'application/octet-stream' })
      }
    }

    // Emit all headers once
    if (allHeaders.length) {
      const headerStrings = allHeaders.map((header) => `'${header.name}: ${header.value}'`)
      parts.push(`curl_setopt($ch, CURLOPT_HTTPHEADER, [${headerStrings.join(', ')}]);`)

      // Add encoding option if Accept-Encoding header includes compression
      const acceptEncoding = allHeaders.find((header) => header.name.toLowerCase() === 'accept-encoding')
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
        // Convert JSON to PHP array syntax
        if (normalizedRequest.postData.text) {
          try {
            const jsonData = JSON.parse(normalizedRequest.postData.text)
            const phpArray = objectToString(jsonData)
            parts.push(`curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(${phpArray}));`)
          } catch {
            parts.push(`curl_setopt($ch, CURLOPT_POSTFIELDS, '${normalizedRequest.postData.text}');`)
          }
        }
      } else if (normalizedRequest.postData.mimeType === 'multipart/form-data' && normalizedRequest.postData.params) {
        // Build multipart payload with curl_mime_* so duplicate keys remain distinct parts.
        hasMultipartMimeBody = true
        parts.push('$mime = curl_mime_init($ch);')

        normalizedRequest.postData.params.forEach((param, index) => {
          const partName = `$part${index}`
          parts.push(`${partName} = curl_mime_addpart($mime);`)
          parts.push(`curl_mime_name(${partName}, '${param.name}');`)

          if (param.fileName !== undefined) {
            parts.push(`curl_mime_filedata(${partName}, '${param.fileName}');`)
          } else if (param.value !== undefined) {
            parts.push(`curl_mime_data(${partName}, '${param.value}');`)
          }

          if (param.contentType) {
            parts.push(`curl_mime_type(${partName}, '${param.contentType}');`)
          }
        })

        parts.push('curl_setopt($ch, CURLOPT_MIMEPOST, $mime);')
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
        parts.push(`curl_setopt($ch, CURLOPT_POSTFIELDS, '${formData}');`)
      } else if (normalizedRequest.postData.mimeType === 'application/octet-stream') {
        parts.push(`curl_setopt($ch, CURLOPT_POSTFIELDS, '${normalizedRequest.postData.text || ''}');`)
      } else if (normalizedRequest.postData.text) {
        // Try to parse as JSON and convert to PHP array, otherwise use raw text
        try {
          const jsonData = JSON.parse(normalizedRequest.postData.text)
          const phpArray = objectToString(jsonData)
          parts.push(`curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(${phpArray}));`)
        } catch {
          parts.push(`curl_setopt($ch, CURLOPT_POSTFIELDS, '${normalizedRequest.postData.text}');`)
        }
      }
    }

    // Execute and close
    parts.push('')
    parts.push('curl_exec($ch);')
    if (hasMultipartMimeBody) {
      parts.push('curl_mime_free($mime);')
    }
    parts.push('')
    parts.push('curl_close($ch);')

    return parts.join('\n').replace(/\n\n\n/g, '\n\n')
  },
}
