import { parseMimeType } from '@scalar/helpers/http/mime-type'
import type { Plugin } from '@scalar/types/snippetz'

import { escapeSingleQuotes } from '@/libs/shell'

/**
 * True for `application/json`, any RFC 6839 `+json` structured-syntax suffix
 * (e.g. `application/vnd.api+json`), and parameterized variants
 * (e.g. `application/json;charset=utf-8`). Case-insensitive.
 */
const isJsonContentType = (value: string | undefined): boolean => {
  if (!value) {
    return false
  }
  const { subtype } = parseMimeType(value)
  return subtype === 'json' || subtype.endsWith('+json')
}

/**
 * Pretty-prints a JSON string and falls back to the original value when it
 * cannot be parsed. Keeps the generated snippet readable, mirroring curl.
 */
const prettyPrintJson = (text: string): string => {
  try {
    return JSON.stringify(JSON.parse(text), null, 2)
  } catch {
    return text
  }
}

/**
 * shell/wget
 */
export const shellWget: Plugin = {
  target: 'shell',
  client: 'wget',
  title: 'Wget',
  generate(request, configuration) {
    // Defaults
    const normalizedRequest = {
      method: 'GET',
      ...request,
    }

    // Normalization
    normalizedRequest.method = normalizedRequest.method.toUpperCase()

    // Build the URL, joining extra query parameters with `&` when the URL already carries a query string
    const baseUrl = normalizedRequest.url ?? ''
    const separator = baseUrl.includes('?') ? '&' : '?'
    const queryString = normalizedRequest.queryString?.length
      ? separator + normalizedRequest.queryString.map((param) => `${param.name}=${param.value}`).join('&')
      : ''
    const url = `${baseUrl}${queryString}`
    // Quote the URL whenever it contains anything the shell could interpret (spaces, query separators, globs, …)
    const isShellSafe = /^[A-Za-z0-9._~:/%@+,=-]*$/.test(url)
    const urlPart = isShellSafe ? url : `'${escapeSingleQuotes(url)}'`

    // Wget runs quietly and writes to stdout so the snippet stays focused on the request
    const parts: string[] = ['wget --quiet', `--method ${normalizedRequest.method}`]

    // Basic Auth
    if (configuration?.auth?.username && configuration?.auth?.password) {
      parts.push(`--user '${escapeSingleQuotes(configuration.auth.username)}'`)
      parts.push(`--password '${escapeSingleQuotes(configuration.auth.password)}'`)
    }

    // Headers
    if (normalizedRequest.headers?.length) {
      normalizedRequest.headers.forEach((header) => {
        const headerValue = escapeSingleQuotes(`${header.name}: ${header.value}`)
        parts.push(`--header '${headerValue}'`)
      })
    }

    // Cookies (wget sends cookies through a Cookie header)
    if (normalizedRequest.cookies?.length) {
      const cookieString = normalizedRequest.cookies
        .map((cookie) => `${encodeURIComponent(cookie.name)}=${encodeURIComponent(cookie.value)}`)
        .join('; ')
      parts.push(`--header 'Cookie: ${escapeSingleQuotes(cookieString)}'`)
    }

    // Body
    if (normalizedRequest.postData) {
      const { mimeType, text, params } = normalizedRequest.postData

      if (isJsonContentType(mimeType)) {
        if (text) {
          parts.push(`--body-data '${escapeSingleQuotes(prettyPrintJson(text))}'`)
        }
      } else if (mimeType === 'application/octet-stream') {
        parts.push(`--body-data '${escapeSingleQuotes(text ?? '')}'`)
      } else if (mimeType === 'application/x-www-form-urlencoded' && params) {
        // Join all fields into a single body, encoding names and values since wget sends --body-data as the raw request body
        const body = params
          .map((param) => `${encodeURIComponent(param.name)}=${encodeURIComponent(param.value ?? '')}`)
          .join('&')
        parts.push(`--body-data '${escapeSingleQuotes(body)}'`)
      } else if (mimeType === 'multipart/form-data' && params) {
        // Wget has no native multipart support, so we approximate it: files are
        // streamed with --body-file and plain fields are sent as --body-data.
        params.forEach((param) => {
          if (param.fileName !== undefined) {
            parts.push(`--body-file='${escapeSingleQuotes(param.fileName)}'`)
          } else {
            const rawValue = param.value ?? ''
            const displayValue = isJsonContentType(param.contentType) && rawValue ? prettyPrintJson(rawValue) : rawValue
            parts.push(`--body-data '${escapeSingleQuotes(`${param.name}=${displayValue}`)}'`)
          }
        })
      } else if (text) {
        // Fall back to the raw text, pretty-printing it when it happens to be JSON
        parts.push(`--body-data '${escapeSingleQuotes(prettyPrintJson(text))}'`)
      }
    }

    parts.push('--output-document', `- ${urlPart}`)

    return parts.join(' \\\n  ')
  },
}
