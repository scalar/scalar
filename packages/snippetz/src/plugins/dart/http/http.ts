import type { Plugin } from '@scalar/types/snippetz'

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
    normalizedRequest.method = normalizedRequest.method.toUpperCase()

    // Start building the Dart code
    let code = `import 'package:http/http.dart' as http;\n\nvoid main() async {\n`

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
      normalizedRequest.headers?.reduce(
        (acc, header) => {
          if (header.value && !/[; ]/.test(header.name)) {
            acc[header.name] = header.value
          }
          return acc
        },
        {} as Record<string, string>,
      ) || {}

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
          code += `    '${key}': '${value}',\n`
        }
      }
      code += '  };\n\n'
    }

    // Handle query string
    const queryString = normalizedRequest.queryString?.length
      ? '?' +
        normalizedRequest.queryString
          .map((param) => `${encodeURIComponent(param.name)}=${encodeURIComponent(param.value)}`)
          .join('&')
      : ''
    const url = `${normalizedRequest.url}${queryString}`

    // Handle body
    let body = ''
    if (normalizedRequest.postData) {
      if (normalizedRequest.postData.mimeType === 'application/json') {
        body = `  final body = r'${normalizedRequest.postData.text}';\n\n`
      } else if (normalizedRequest.postData.mimeType === 'application/x-www-form-urlencoded') {
        body = `  final body = '${normalizedRequest.postData.params?.map((param) => `${encodeURIComponent(param.name)}=${encodeURIComponent(param.value ?? '')}`).join('&') || ''}';\n\n`
      } else if (normalizedRequest.postData.mimeType === 'multipart/form-data') {
        body = '  final body = <String,String>{\n'
        for (const param of normalizedRequest.postData.params || []) {
          const value = param.value || ''
          const fileName = param.fileName || ''
          body += `    '${param.name}': '${fileName || value}',\n`
        }
        body += '  };\n\n'
      } else if (normalizedRequest.postData.mimeType === 'application/octet-stream') {
        body = `  final body = '${normalizedRequest.postData.text}';\n\n`
      }
    }

    if (body) {
      code += body
    }

    // Handle method and request
    const method = normalizedRequest.method.toLowerCase()
    const headersPart = Object.keys(headers).length > 0 ? ', headers: headers' : ''
    const bodyPart = body ? ', body: body' : ''
    code += `  final response = await http.${method}(Uri.parse('${url}')${headersPart}${bodyPart});\n`
    code += '  print(response.body);\n'
    code += '}'

    return code
  },
}
