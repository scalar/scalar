import type { Plugin } from '@scalar/types/snippetz'

import { joinUrlAndQuery, normalizeMethod } from '@/libs/http'

/**
 * dart/http
 */
export const dartHttp: Plugin = {
  target: 'dart',
  client: 'http',
  title: 'Http',
  generate(request, options?: { auth?: { username: string; password: string } }) {
    // Defaults
    const normalizedRequest = {
      method: 'GET',
      ...request,
    }

    // Normalize method to uppercase
    normalizedRequest.method = normalizeMethod(normalizedRequest.method)

    const multipart =
      normalizedRequest.postData?.mimeType === 'multipart/form-data' && normalizedRequest.postData.params
    const dartString = (value: string): string => JSON.stringify(value).replaceAll('$', '\\$')
    // Single quoted Dart string that is safe for quotes, backslashes, dollar signs and line breaks
    const dartSingleQuoted = (value: string): string =>
      `'${value
        .replaceAll('\\', '\\\\')
        .replaceAll("'", "\\'")
        .replaceAll('$', '\\$')
        .replaceAll('\n', '\\n')
        .replaceAll('\r', '\\r')}'`

    // Start building the Dart code
    let code = `import 'package:http/http.dart' as http;\n\nvoid main() async {\n`

    if (Array.isArray(multipart) && multipart.some((param) => param.contentType)) {
      code = `import 'package:http_parser/http_parser.dart';\n${code}`
    }

    // Handle cookies
    let cookieHeader = ''
    let cookieString = ''
    if (normalizedRequest.cookies && normalizedRequest.cookies.length > 0) {
      cookieString = normalizedRequest.cookies
        .map((cookie) => `${encodeURIComponent(cookie.name)}=${encodeURIComponent(cookie.value)}`)
        .join('; ')
      cookieHeader = `  "Cookie": "${cookieString}",\n`
    }

    // Handle headers
    const headers =
      normalizedRequest.headers?.reduce<Record<string, string>>((acc, header) => {
        if (header.value && !/[; ]/.test(header.name) && !(multipart && header.name.toLowerCase() === 'content-type')) {
          acc[header.name] = header.value
        }
        return acc
      }, {}) || {}

    // Add Authorization header if credentials are provided
    if (options?.auth) {
      const { username, password } = options.auth

      if (username && password) {
        const credentials = `${username}:${password}`
        headers['Authorization'] = `'Basic ' + base64Encode(utf8.encode('${credentials}'))`
      }
    }

    if (cookieHeader) {
      headers['Cookie'] = cookieString
    }

    if (Object.keys(headers).length > 0) {
      code += '  final headers = <String,String>{\n'
      for (const [key, value] of Object.entries(headers)) {
        if (value.includes('utf8.encode')) {
          code += `    '${key}': ${value},\n`
        } else {
          code += `    ${dartSingleQuoted(key)}: ${dartSingleQuoted(value)},\n`
        }
      }
      code += '  };\n\n'
    }

    // Handle query string
    const url = joinUrlAndQuery(normalizedRequest.url ?? '', normalizedRequest.queryString)

    // Handle body
    let body = ''
    if (normalizedRequest.postData) {
      if (normalizedRequest.postData.mimeType === 'application/json') {
        const jsonText = normalizedRequest.postData.text ?? ''
        // A raw string keeps the JSON readable, but it cannot hold a single quote or a line break
        body = /['\r\n]/.test(jsonText)
          ? `  final body = ${dartSingleQuoted(jsonText)};\n\n`
          : `  final body = r'${jsonText}';\n\n`
      } else if (normalizedRequest.postData.mimeType === 'application/x-www-form-urlencoded') {
        const formBody =
          normalizedRequest.postData.params
            ?.map((param) => `${encodeURIComponent(param.name)}=${encodeURIComponent(param.value ?? '')}`)
            .join('&') || ''
        body = `  final body = ${dartSingleQuoted(formBody)};\n\n`
      } else if (normalizedRequest.postData.mimeType === 'application/octet-stream') {
        body = `  final body = ${dartSingleQuoted(normalizedRequest.postData.text ?? '')};\n\n`
      } else if (normalizedRequest.postData.text) {
        body = `  final body = ${dartSingleQuoted(normalizedRequest.postData.text)};\n\n`
      }
    }

    if (body) {
      code += body
    }

    if (multipart) {
      code += `  final request = http.MultipartRequest(${dartString(normalizedRequest.method)}, Uri.parse(${dartString(url)}));\n`
      if (Object.keys(headers).length) {
        code += '  request.headers.addAll(headers);\n'
      }
      for (const param of multipart) {
        const type = param.contentType ? `, contentType: MediaType.parse(${dartString(param.contentType)})` : ''
        code +=
          param.fileName !== undefined
            ? `  request.files.add(await http.MultipartFile.fromPath(${dartString(param.name)}, ${dartString(param.fileName)}${type}));\n`
            : `  request.files.add(http.MultipartFile.fromString(${dartString(param.name)}, ${dartString(param.value ?? '')}${type}));\n`
      }
      code += '  final response = await http.Response.fromStream(await request.send());\n'
      code += '  print(response.body);\n}'
      return code
    }

    // Handle method and request
    const method = normalizedRequest.method.toLowerCase()
    const headersPart = Object.keys(headers).length > 0 ? ', headers: headers' : ''
    const bodyPart = body ? ', body: body' : ''
    if (
      ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD'].includes(normalizedRequest.method) &&
      !(body && ['GET', 'HEAD'].includes(normalizedRequest.method))
    ) {
      code += `  final response = await http.${method}(Uri.parse('${url}')${headersPart}${bodyPart});\n`
    } else {
      const wireMethod = normalizedRequest.method.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\$/g, '\\$')
      code += `  final request = http.Request('${wireMethod}', Uri.parse('${url}'));\n`
      if (Object.keys(headers).length > 0) {
        code += '  request.headers.addAll(headers);\n'
      }
      if (body) {
        code +=
          normalizedRequest.postData?.mimeType === 'multipart/form-data'
            ? '  request.bodyFields = body;\n'
            : '  request.body = body;\n'
      }
      code += '  final response = await http.Response.fromStream(await request.send());\n'
    }
    code += '  print(response.body);\n'
    code += '}'

    return code
  },
}
