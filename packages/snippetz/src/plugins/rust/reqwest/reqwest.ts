import { toRustString } from '@/plugins/rust/rustString'
import type { Plugin } from '@scalar/types/snippetz'

/**
 * rust/reqwest
 */
export const rustReqwest: Plugin = {
  target: 'rust',
  client: 'reqwest',
  title: 'reqwest',
  generate(request, options?: { auth?: { username: string; password: string } }) {
    // Defaults
    const normalizedRequest = {
      method: 'GET',
      ...request,
    }

    // Normalize method to uppercase
    normalizedRequest.method = normalizedRequest.method.toUpperCase()

    // Start building the Rust code
    let code = 'let client = reqwest::Client::new();\n'

    // Handle query string
    const queryString = normalizedRequest.queryString?.length
      ? '?' +
        normalizedRequest.queryString
          .map((param) => `${encodeURIComponent(param.name)}=${encodeURIComponent(param.value)}`)
          .join('&')
      : ''
    const url = `${normalizedRequest.url}${queryString}`

    // Start building request
    const method = normalizedRequest.method.toLowerCase()
    code += `let request = client.${method}(${toRustString(url)})`

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

    // Handle cookies
    if (normalizedRequest.cookies && normalizedRequest.cookies.length > 0) {
      const cookieString = normalizedRequest.cookies
        .map((cookie) => `${encodeURIComponent(cookie.name)}=${encodeURIComponent(cookie.value)}`)
        .join('; ')
      headers['Cookie'] = cookieString
    }

    // Add Authorization header if credentials are provided
    if (options?.auth) {
      const { username, password } = options.auth
      if (username && password) {
        code += `\n    .basic_auth(${toRustString(username)}, ${toRustString(password)})`
      }
    }

    // Add headers to request
    for (const [key, value] of Object.entries(headers)) {
      code += `\n    .header(${toRustString(key)}, ${toRustString(value)})`
    }

    // Handle body
    if (normalizedRequest.postData) {
      if (normalizedRequest.postData.mimeType === 'application/json') {
        code += `\n    .json(&serde_json::json!(${normalizedRequest.postData.text}))`
      } else if (normalizedRequest.postData.mimeType === 'application/x-www-form-urlencoded') {
        const formData =
          normalizedRequest.postData.params
            ?.map((param) => `(${toRustString(param.name)}, ${toRustString(param.value || '')})`)
            .join(', ') || ''
        code += `\n    .form(&[${formData}])`
      } else if (normalizedRequest.postData.mimeType === 'multipart/form-data') {
        code += '\n    .multipart({'
        const formParts =
          normalizedRequest.postData.params
            ?.map((param) => {
              if (param.fileName) {
                return `\n        let part = reqwest::multipart::Part::text(${toRustString(param.value || '')})\n            .file_name(${toRustString(param.fileName)});\n        form = form.part(${toRustString(param.name)}, part);`
              }

              return `\n        form = form.text(${toRustString(param.name)}, ${toRustString(param.value || '')});`
            })
            .join('') || ''
        code += `\n        let mut form = reqwest::multipart::Form::new();${formParts}\n            form\n        })`
      } else {
        code += `\n    .body(${toRustString(normalizedRequest.postData.text || '')})`
      }
    }

    code += ';\n'
    code += 'let response = request.send().await?;'

    return code
  },
}
