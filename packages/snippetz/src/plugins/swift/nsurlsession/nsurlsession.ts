import type { Plugin } from '@scalar/types/snippetz'

import { collectHeaders, joinUrlAndQuery, normalizeMethod, normalizeUrl } from '@/libs/http'

const swiftStringLiteral = (value: string): string => JSON.stringify(value)

const rawMultilineStringHashes = (value: string): string => {
  let hashCount = 1
  while (value.includes(`"""${'#'.repeat(hashCount)}`)) {
    hashCount += 1
  }

  return '#'.repeat(hashCount)
}

const toPrettyJson = (value: string): string => {
  try {
    return JSON.stringify(JSON.parse(value), null, 2)
  } catch {
    return value
  }
}

const encodeFormComponent = (value: string): string => encodeURIComponent(value)

const escapeForMultipartHeader = (value: string): string => value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')

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
    const escapedContentType = param.contentType ? escapeForMultipartHeader(param.contentType) : undefined

    lines.push(`appendToBody("--\\(boundary)\\r\\n")`)
    if (param.fileName !== undefined) {
      lines.push(
        `appendToBody(${swiftStringLiteral(
          `Content-Disposition: form-data; name="${escapedName}"; filename="${escapedFileName}"\r\n`,
        )})`,
      )
      if (escapedContentType) {
        lines.push(`appendToBody(${swiftStringLiteral(`Content-Type: ${escapedContentType}\r\n`)})`)
      }
      lines.push('appendToBody("\\r\\n")')
      lines.push(`appendToBody(${swiftStringLiteral(`<# File data for ${param.fileName || 'file'} #>\r\n`)})`)
    } else {
      lines.push(`appendToBody(${swiftStringLiteral(`Content-Disposition: form-data; name="${escapedName}"\r\n`)})`)
      if (escapedContentType) {
        lines.push(`appendToBody(${swiftStringLiteral(`Content-Type: ${escapedContentType}\r\n`)})`)
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
    const headers = collectHeaders(request.headers, request.cookies)
    const lines: string[] = [
      'import Foundation',
      '',
      `var request = URLRequest(url: URL(string: ${swiftStringLiteral(url)})!)`,
    ]

    lines.push(`request.httpMethod = ${swiftStringLiteral(method)}`)

    headers.forEach((header) => {
      lines.push(
        `request.setValue(${swiftStringLiteral(header.value)}, forHTTPHeaderField: ${swiftStringLiteral(header.name)})`,
      )
    })

    if (configuration?.auth?.username && configuration?.auth?.password) {
      lines.push(
        `let credentials = ${swiftStringLiteral(`${configuration.auth.username}:${configuration.auth.password}`)}`,
      )
      lines.push('let encodedCredentials = Data(credentials.utf8).base64EncodedString()')
      lines.push('request.setValue("Basic \\(encodedCredentials)", forHTTPHeaderField: "Authorization")')
    }

    if (request.postData) {
      const { mimeType, text, params } = request.postData

      if (mimeType === 'application/json' && text !== undefined) {
        const prettyJson = toPrettyJson(text)
        const hashes = rawMultilineStringHashes(prettyJson)
        lines.push(`let jsonBody = ${hashes}"""`)
        lines.push(prettyJson)
        lines.push(`"""${hashes}`)
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
