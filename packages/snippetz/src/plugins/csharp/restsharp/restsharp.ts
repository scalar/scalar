import { parseMimeType } from '@scalar/helpers/http/mime-type'
import type { Plugin } from '@scalar/types/snippetz'
import { encode } from 'js-base64'

import { joinUrlAndQuery } from '@/libs/http'

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
 * Maps an HTTP method to a RestSharp `Method` enum member. The enum uses
 * PascalCase members (`Method.Get`, `Method.Post`, ...), so we title-case the
 * method name to cover both the well-known verbs and any custom ones.
 */
const getMethod = (method: string): string => {
  const titleCased = method.charAt(0).toUpperCase() + method.slice(1).toLowerCase()
  return `Method.${titleCased}`
}

/**
 * Escapes a value for use inside a regular C# double-quoted string literal.
 * Backslashes and double quotes are escaped, and newlines, carriage returns,
 * and tabs are turned into their escape sequences so values stay on a single
 * line and the generated snippet remains valid C#.
 */
const escapeCSharpString = (text: string): string =>
  text.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t')

/**
 * Wraps text in a C# raw string literal (`"""`), growing the delimiter when the
 * payload itself contains a run of quotes. This keeps multi-line JSON bodies
 * readable without escaping every quote.
 */
const createRawStringLiteral = (text: string): string => {
  let quoteCount = 3
  while (text.includes('"'.repeat(quoteCount))) {
    quoteCount++
  }
  const quotes = '"'.repeat(quoteCount)
  return `${quotes}\n${text}\n${quotes}`
}

/**
 * csharp/restsharp
 */
export const csharpRestsharp: Plugin = {
  target: 'csharp',
  client: 'restsharp',
  title: 'RestSharp',
  generate(request, configuration) {
    // Defaults
    const normalizedRequest = {
      method: 'GET',
      url: '',
      ...request,
    }

    // Normalization
    normalizedRequest.method = normalizedRequest.method.toUpperCase()

    // Build the full URL, appending the query string with the correct separator
    // (joinUrlAndQuery uses `&` when the URL already carries a query string)
    const url = joinUrlAndQuery(normalizedRequest.url, normalizedRequest.queryString)

    // Derive the host so cookies can be scoped to it (RestSharp requires a domain)
    let host = ''
    try {
      host = new URL(url).host
    } catch {
      // Leave the host empty when the URL cannot be parsed
    }

    const lines: string[] = []

    // Client and request
    lines.push(`var client = new RestClient("${escapeCSharpString(url)}");`)
    lines.push(`var request = new RestRequest("", ${getMethod(normalizedRequest.method)});`)

    // Basic Auth (added as an Authorization header so the client stays request-scoped)
    const { username, password } = configuration?.auth ?? {}
    const hasBasicAuth = Boolean(username && password)
    if (hasBasicAuth) {
      const credentials = encode(`${username}:${password}`)
      lines.push(`request.AddHeader("Authorization", "Basic ${credentials}");`)
    }

    // Headers (skip an existing Authorization header when Basic auth from config takes precedence)
    normalizedRequest.headers?.forEach((header) => {
      if (hasBasicAuth && header.name.toLowerCase() === 'authorization') {
        return
      }
      lines.push(`request.AddHeader("${escapeCSharpString(header.name)}", "${escapeCSharpString(header.value)}");`)
    })

    // Cookies
    normalizedRequest.cookies?.forEach((cookie) => {
      lines.push(
        `request.AddCookie("${escapeCSharpString(cookie.name)}", "${escapeCSharpString(cookie.value)}", "/", "${escapeCSharpString(host)}");`,
      )
    })

    // Body
    if (normalizedRequest.postData) {
      const { mimeType, text, params } = normalizedRequest.postData

      // Compare against the essence so parameterized values (e.g. a `boundary` or
      // `charset`) still match the form, multipart, and octet-stream branches.
      const essence = mimeType ? parseMimeType(mimeType).essence : undefined

      if (isJsonContentType(mimeType)) {
        if (text) {
          let body = text
          try {
            body = JSON.stringify(JSON.parse(text), null, 2)
          } catch {
            // Fall back to the raw text if it is not valid JSON
          }
          lines.push(`request.AddStringBody(${createRawStringLiteral(body)}, ContentType.Json);`)
        }
      } else if (essence === 'application/x-www-form-urlencoded' && params) {
        params.forEach((param) => {
          lines.push(
            `request.AddParameter("${escapeCSharpString(param.name)}", "${escapeCSharpString(param.value ?? '')}");`,
          )
        })
      } else if (essence === 'multipart/form-data' && params) {
        params.forEach((param) => {
          if (param.fileName !== undefined) {
            if (param.contentType) {
              lines.push(
                `request.AddFile("${escapeCSharpString(param.name)}", "${escapeCSharpString(param.fileName)}", "${escapeCSharpString(param.contentType)}");`,
              )
            } else {
              lines.push(
                `request.AddFile("${escapeCSharpString(param.name)}", "${escapeCSharpString(param.fileName)}");`,
              )
            }
          } else {
            lines.push(
              `request.AddParameter("${escapeCSharpString(param.name)}", "${escapeCSharpString(param.value ?? '')}");`,
            )
          }
        })
      } else if (essence === 'application/octet-stream' && text) {
        lines.push(
          `request.AddParameter("application/octet-stream", "${escapeCSharpString(text)}", ParameterType.RequestBody);`,
        )
      } else if (text) {
        lines.push(
          `request.AddParameter("${escapeCSharpString(mimeType ?? '')}", "${escapeCSharpString(text)}", ParameterType.RequestBody);`,
        )
      }
    }

    // Execute
    lines.push('var response = await client.ExecuteAsync(request);')

    return lines.join('\n')
  },
}
