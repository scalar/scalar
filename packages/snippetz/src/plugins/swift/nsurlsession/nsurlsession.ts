import type { Plugin } from '@scalar/types/snippetz'

import { buildQueryString } from '@/libs/http'

const normalizeMethod = (method?: string): string => (method ?? 'GET').toUpperCase()

const normalizeUrl = (url: string): string => {
  if (!url) {
    return ''
  }

  try {
    const parsedUrl = new URL(url)

    if (parsedUrl.pathname === '/') {
      return `${parsedUrl.origin}${parsedUrl.search}${parsedUrl.hash}`
    }

    return parsedUrl.toString()
  } catch {
    return url
  }
}

const joinUrlAndQuery = (url: string, queryString?: Array<{ name: string; value: string }>): string => {
  const query = buildQueryString(queryString)

  if (!query) {
    return url
  }

  if (!url) {
    return query
  }

  return `${url}${url.includes('?') ? '&' : '?'}${query.slice(1)}`
}

const swiftStringLiteral = (value: string): string => JSON.stringify(value)

const toPrettyJson = (value: string): string => {
  try {
    return JSON.stringify(JSON.parse(value), null, 2)
  } catch {
    return value
  }
}

const encodeFormComponent = (value: string): string => encodeURIComponent(value)

const escapeForMultipartHeader = (value: string): string => value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')

type HeaderPair = {
  name: string
  value: string
}

const collectHeaders = (
  headers?: Array<{
    name: string
    value: string
  }>,
): HeaderPair[] => {
  const dedupedHeaders = new Map<string, string>()
  headers?.forEach((header) => {
    if (header.name) {
      dedupedHeaders.set(header.name, header.value ?? '')
    }
  })

  return Array.from(dedupedHeaders.entries()).map(([name, value]) => ({ name, value }))
}

const buildMultipartBody = (
  params: Array<{
    name: string
    value?: string
    fileName?: string
    contentType?: string
  }>,
): string[] => {
  const lines: string[] = [
    'let boundary = UUID().uuidString',
    'var body = Data()',
    '',
    'func appendToBody(_ value: String) {',
    '  body.append(value.data(using: .utf8)!)',
    '}',
    '',
  ]

  params.forEach((param) => {
    const escapedName = escapeForMultipartHeader(param.name)
    const escapedFileName = escapeForMultipartHeader(param.fileName ?? '')

    lines.push(`appendToBody("--\\(boundary)\\r\\n")`)
    if (param.fileName !== undefined) {
      lines.push(
        `appendToBody("Content-Disposition: form-data; name=\\\\\\"${escapedName}\\\\\\"; filename=\\\\\\"${escapedFileName}\\\\\\"\\r\\n")`,
      )
      if (param.contentType) {
        lines.push(`appendToBody("Content-Type: ${param.contentType}\\r\\n")`)
      }
      lines.push('appendToBody("\\r\\n")')
      lines.push(`appendToBody("<# File data for ${param.fileName ?? 'file'} #>\\r\\n")`)
    } else {
      lines.push(`appendToBody("Content-Disposition: form-data; name=\\\\\\"${escapedName}\\\\\\"\\r\\n")`)
      if (param.contentType) {
        lines.push(`appendToBody("Content-Type: ${param.contentType}\\r\\n")`)
      }
      lines.push('appendToBody("\\r\\n")')
      lines.push(`appendToBody(${swiftStringLiteral(param.value ?? '')})`)
      lines.push('appendToBody("\\r\\n")')
    }
    lines.push('')
  })

  lines.push('appendToBody("--\\(boundary)--\\r\\n")')

  return lines
}

/**
 * swift/nsurlsession
 */
export const swiftNsurlsession: Plugin = {
  target: 'swift',
  client: 'nsurlsession',
  title: 'NSURLSession',
  generate(request, configuration) {
    if (!request) {
      return ''
    }

    const method = normalizeMethod(request.method)
    const url = normalizeUrl(joinUrlAndQuery(request.url ?? '', request.queryString))
    const headers = collectHeaders(request.headers)
    const lines: string[] = ['import Foundation', '', `var request = URLRequest(url: URL(string: ${swiftStringLiteral(url)})!)`]

    lines.push(`request.httpMethod = ${swiftStringLiteral(method)}`)

    headers.forEach((header) => {
      lines.push(
        `request.setValue(${swiftStringLiteral(header.value)}, forHTTPHeaderField: ${swiftStringLiteral(header.name)})`,
      )
    })

    if (request.cookies?.length) {
      const cookieString = request.cookies
        .map((cookie) => `${encodeFormComponent(cookie.name)}=${encodeFormComponent(cookie.value)}`)
        .join('; ')

      lines.push(`request.setValue(${swiftStringLiteral(cookieString)}, forHTTPHeaderField: "Cookie")`)
    }

    if (configuration?.auth?.username && configuration?.auth?.password) {
      lines.push(`let credentials = ${swiftStringLiteral(`${configuration.auth.username}:${configuration.auth.password}`)}`)
      lines.push('let encodedCredentials = Data(credentials.utf8).base64EncodedString()')
      lines.push('request.setValue("Basic \\(encodedCredentials)", forHTTPHeaderField: "Authorization")')
    }

    if (request.postData) {
      const { mimeType, text, params } = request.postData

      if (mimeType === 'application/json' && text !== undefined) {
        const prettyJson = toPrettyJson(text)
        lines.push('let jsonBody = """')
        lines.push(prettyJson)
        lines.push('"""')
        lines.push('request.httpBody = jsonBody.data(using: .utf8)')
      } else if (mimeType === 'application/x-www-form-urlencoded' && params?.length) {
        const formBody = params
          .map((param) => `${encodeFormComponent(param.name)}=${encodeFormComponent(param.value ?? '')}`)
          .join('&')
        lines.push(`let formBody = ${swiftStringLiteral(formBody)}`)
        lines.push('request.httpBody = formBody.data(using: .utf8)')
      } else if (mimeType === 'multipart/form-data' && params?.length) {
        lines.push(...buildMultipartBody(params))
        lines.push('request.setValue("multipart/form-data; boundary=\\(boundary)", forHTTPHeaderField: "Content-Type")')
        lines.push('request.httpBody = body')
      } else if (mimeType === 'application/octet-stream') {
        lines.push(`let binaryBody = Data(${swiftStringLiteral(text ?? '')}.utf8)`)
        lines.push('request.httpBody = binaryBody')
      } else if (text !== undefined) {
        lines.push(`let rawBody = ${swiftStringLiteral(text)}`)
        lines.push('request.httpBody = rawBody.data(using: .utf8)')
      }
    }

    lines.push('')
    lines.push('let (data, response) = try await URLSession.shared.data(for: request)')
    lines.push('')
    lines.push('guard let httpResponse = response as? HTTPURLResponse,')
    lines.push('      200..<300 ~= httpResponse.statusCode else {')
    lines.push('  throw URLError(.badServerResponse)')
    lines.push('}')
    lines.push('')
    lines.push('print(String(data: data, encoding: .utf8) ?? "")')

    return lines.join('\n')
  },
}
