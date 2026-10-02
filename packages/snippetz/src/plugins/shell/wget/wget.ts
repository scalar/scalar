import { isJsonMediaType } from '@scalar/helpers/http/is-json-media-type'
import type { Plugin } from '@scalar/types/snippetz'

import { normalizeMethod } from '@/libs/http'
import { multipartFileBoundary, prepareRequest } from '@/libs/prepare-request'
import { escapeSingleQuotes } from '@/libs/shell'
import { buildShellBody, quoteShellBoundary, shellBoundarySetup } from '@/libs/shell-body'

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
    // Defaults and normalization. Resolving the method from `request` directly guards
    // against an explicit `method: undefined`, which would otherwise overwrite the default.
    const normalizedRequest = {
      ...request,
      method: normalizeMethod(request?.method),
    }

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

    const multipart =
      normalizedRequest.postData?.mimeType === 'multipart/form-data' && normalizedRequest.postData.params
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

      if (isJsonMediaType(mimeType)) {
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
        parts.push('--body-file="$multipart_body"')
      } else if (text) {
        // Fall back to the raw text, pretty-printing it when it happens to be JSON
        parts.push(`--body-data '${escapeSingleQuotes(prettyPrintJson(text))}'`)
      }
    }

    parts.push('--output-document', `- ${urlPart}`)

    const command = parts.join(' \\\n  ')
    return multipart?.body
      ? `${boundary ? shellBoundarySetup : ''}multipart_body=$(mktemp)\ntrap 'rm -f "$multipart_body"' EXIT\n${buildShellBody(multipart.body, boundary)} > "$multipart_body"\n${command}`
      : command
  },
}
