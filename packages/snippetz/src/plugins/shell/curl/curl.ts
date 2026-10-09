import { isJsonMediaType } from '@scalar/helpers/http/is-json-media-type'
import { isStreamingContentType } from '@scalar/helpers/http/is-streaming-content-type'
import type { Plugin } from '@scalar/types/snippetz'

import { joinUrlAndQuery, normalizeMethod } from '@/libs/http'
import { multipartFileBoundary, prepareRequest } from '@/libs/prepare-request'
import { escapeSingleQuotes } from '@/libs/shell'
import { buildShellBody, quoteShellBoundary, shellBoundarySetup } from '@/libs/shell-body'

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
    normalizedRequest.method = normalizeMethod(normalizedRequest.method)

    // Build curl command parts
    const parts: string[] = ['curl']

    const url = joinUrlAndQuery(normalizedRequest.url ?? '', normalizedRequest.queryString)
    // Quote the URL whenever it contains anything the shell could interpret (spaces, query separators, globs, …)
    const isShellSafe = /^[A-Za-z0-9._~:/%@+,=-]*$/.test(url)
    const urlPart = isShellSafe ? url : `'${escapeSingleQuotes(url)}'`
    parts[0] = `curl ${urlPart}`

    // curl reads `[]` (ranges) and `{}` (sets) in a URL as its own globbing syntax, no matter how the shell
    // quotes them. Square brackets always break curl (`filter[id]=1` throws "bad range"), so disable globbing
    // whenever they appear. Curly braces in the path are almost always placeholders like `/users/{id}` that you
    // replace before running, so we leave those to avoid adding the flag to nearly every snippet — but braces in
    // the query string are real glob sets (`?ids={1,2,3}` fans out into three requests), so disable it there.
    const queryStart = url.indexOf('?')
    const queryPart = queryStart === -1 ? '' : url.slice(queryStart)
    if (/[[\]]/.test(url) || /[{}]/.test(queryPart)) {
      parts.push('--globoff')
    }

    // Method
    if (normalizedRequest.method !== 'GET') {
      parts.push(`--request ${normalizedRequest.method}`)
    }

    // Basic Auth
    if (configuration?.auth?.username && configuration?.auth?.password) {
      const authValue = escapeSingleQuotes(`${configuration.auth.username}:${configuration.auth.password}`)
      parts.push(`--user '${authValue}'`)
    }

    // cURL has its own form grammar inside the shell argument. Serialize explicitly
    // when quoted filenames or typed literal values could be interpreted as directives.
    const multipart =
      normalizedRequest.postData?.mimeType === 'multipart/form-data' &&
      normalizedRequest.postData.params?.some(
        (param) =>
          /[;=",\r\n]/.test(param.name) ||
          (param.fileName !== undefined
            ? /[;,"\\\r\n]/.test(param.fileName)
            : Boolean(param.contentType) && (/^[@<"]/.test(param.value ?? '') || /[;]/.test(param.value ?? ''))),
      )
        ? prepareRequest(normalizedRequest)
        : undefined

    const boundary = multipartFileBoundary(multipart)

    // Headers
    const headers = multipart?.headers ?? normalizedRequest.headers
    if (headers?.length) {
      headers.forEach((header) => {
        const headerValue = quoteShellBoundary(
          `${header.name}: ${header.value}`,
          header.name.toLowerCase() === 'content-type' ? boundary : undefined,
        )
        parts.push(`--header ${headerValue}`)
      })

      // Add compressed flag if Accept-Encoding header includes compression
      const acceptEncoding = headers.find((header) => header.name.toLowerCase() === 'accept-encoding')
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
      if (isJsonMediaType(normalizedRequest.postData.mimeType)) {
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
      } else if (isStreamingContentType(normalizedRequest.postData.mimeType ?? '')) {
        // Use the explicit binary mode consistently for framed streaming media types.
        const escapedText = escapeSingleQuotes(normalizedRequest.postData.text ?? '')
        parts.push(`--data-binary '${escapedText}'`)
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
        if (multipart) {
          parts.push('--data-binary @-')
        } else {
          // Handle multipart form data
          normalizedRequest.postData.params.forEach((param) => {
            const escapedName = escapeSingleQuotes(param.name)
            const multipartValueSuffix = param.contentType ? `;type=${param.contentType}` : ''
            if (param.fileName !== undefined) {
              const escapedFileName = escapeSingleQuotes(`${param.fileName}${multipartValueSuffix}`)
              parts.push(`--form '${escapedName}=@${escapedFileName}'`)
            } else {
              const rawValue = param.value ?? ''
              // Pretty-print parts whose contentType is JSON so the snippet stays readable,
              // mirroring what we already do for `--data` JSON bodies above.
              const isJsonPart = isJsonMediaType(param.contentType)
              let displayValue = rawValue
              if (isJsonPart && rawValue) {
                try {
                  displayValue = JSON.stringify(JSON.parse(rawValue), null, 2)
                } catch {
                  // Fall back to the raw value if it is not valid JSON.
                }
              }
              const escapedValue = escapeSingleQuotes(`${displayValue}${multipartValueSuffix}`)
              if (
                !param.contentType &&
                (displayValue.startsWith('@') || displayValue.startsWith('<') || displayValue.includes(';'))
              ) {
                parts.push(`--form-string '${escapedName}=${escapeSingleQuotes(displayValue)}'`)
              } else {
                parts.push(`--form '${escapedName}=${escapedValue}'`)
              }
            }
          })
        }
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

    const command = parts.join(' \\\n  ')
    return multipart?.body
      ? `${boundary ? shellBoundarySetup : ''}${buildShellBody(multipart.body, boundary)} | ${command}`
      : command
  },
}
