import type { Plugin } from '@scalar/types/snippetz'

import { normalizeMethod } from '@/libs/http'
import { objectToString } from '@/libs/php'
import { multipartFileBoundary, prepareRequest } from '@/libs/prepare-request'

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
    normalizedRequest.method = normalizeMethod(normalizedRequest.method)

    // Build PHP cURL code parts
    const parts: string[] = []
    const multipart =
      normalizedRequest.postData?.mimeType === 'multipart/form-data' && normalizedRequest.postData.params
        ? prepareRequest(normalizedRequest)
        : undefined

    const boundary = multipartFileBoundary(multipart)
    const literal = (value: string): string =>
      boundary ? `str_replace(${objectToString(boundary)}, $boundary, ${objectToString(value)})` : objectToString(value)
    if (boundary) {
      parts.push('$boundary = bin2hex(random_bytes(16));')
    }

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
    } else if (normalizedRequest.method !== 'GET') {
      parts.push(`curl_setopt($ch, CURLOPT_CUSTOMREQUEST, '${normalizedRequest.method}');`)
    }

    // Basic Auth
    if (configuration?.auth?.username && configuration?.auth?.password) {
      parts.push(`curl_setopt($ch, CURLOPT_USERPWD, '${configuration.auth.username}:${configuration.auth.password}');`)
    }

    // Collect all headers to emit once, avoiding duplicate CURLOPT_HTTPHEADER calls.
    // Body processing may add a Content-Type header, so we determine it first.
    const allHeaders = multipart?.headers ?? [...(normalizedRequest.headers || [])]

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
      const headerStrings = allHeaders.map((header) =>
        header.name.toLowerCase() === 'content-type'
          ? literal(`${header.name}: ${header.value}`)
          : objectToString(`${header.name}: ${header.value}`),
      )
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
        // PHP does not expose curl_mime_*; an explicit body also preserves repeated field names.
        parts.push("$body = '';")
        for (const segment of multipart?.body ?? []) {
          parts.push(
            'file' in segment
              ? `$body .= file_get_contents(${objectToString(segment.file)});`
              : `$body .= ${literal(segment.text)};`,
          )
        }
        parts.push('curl_setopt($ch, CURLOPT_POSTFIELDS, $body);')
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
    parts.push('')
    parts.push('curl_close($ch);')

    return parts.join('\n').replace(/\n\n\n/g, '\n\n')
  },
}
