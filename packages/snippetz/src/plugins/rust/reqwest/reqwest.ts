import { toRustString } from '@/plugins/rust/rustString'
import type { Plugin } from '@scalar/types/snippetz'

/**
 * Helper function to create indented strings
 */
const indent = (level: number, text: string): string => {
  const spaces = ' '.repeat(level * 4)
  return `${spaces}${text}`
}

/**
 * Helper function to create chained method calls with consistent indentation
 */
const createChainedCall = (method: string, ...args: string[]): string => {
  return indent(1, `.${method}(${args.join(', ')})`)
}

/**
 * Helper function to create multipart form parts with proper indentation
 */
const createMultipartPart = (param: { name: string; value?: string; fileName?: string }): string => {
  if (param.fileName) {
    return [
      indent(2, `let part = reqwest::multipart::Part::text(${toRustString(param.value || '')})`),
      indent(3, `.file_name(${toRustString(param.fileName)});`),
      indent(2, `form = form.part(${toRustString(param.name)}, part);`),
    ].join('\n')
  }

  return indent(2, `form = form.text(${toRustString(param.name)}, ${toRustString(param.value || '')});`)
}

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

    // Build Rust code parts
    const parts: string[] = ['let client = reqwest::Client::new();']

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
    parts.push(`let request = client.${method}(${toRustString(url)})`)

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

    // Collect chained calls
    const chainedCalls: string[] = []

    // Add Authorization header if credentials are provided
    if (options?.auth) {
      const { username, password } = options.auth
      if (username && password) {
        chainedCalls.push(createChainedCall('basic_auth', toRustString(username), toRustString(password)))
      }
    }

    // Add headers to request
    for (const [key, value] of Object.entries(headers)) {
      chainedCalls.push(createChainedCall('header', toRustString(key), toRustString(value)))
    }

    // Handle body
    if (normalizedRequest.postData) {
      if (normalizedRequest.postData.mimeType === 'application/json') {
        chainedCalls.push(createChainedCall('json', `&serde_json::json!(${normalizedRequest.postData.text})`))
      } else if (normalizedRequest.postData.mimeType === 'application/x-www-form-urlencoded') {
        const formData =
          normalizedRequest.postData.params
            ?.map((param) => `(${toRustString(param.name)}, ${toRustString(param.value || '')})`)
            .join(', ') || ''
        chainedCalls.push(createChainedCall('form', `&[${formData}]`))
      } else if (normalizedRequest.postData.mimeType === 'multipart/form-data') {
        const formParts = normalizedRequest.postData.params?.map(createMultipartPart).join('\n') || ''

        const multipartBlock = [
          '.multipart({',
          indent(2, 'let mut form = reqwest::multipart::Form::new();'),
          formParts,
          indent(3, 'form'),
          indent(2, '})'),
        ].join('\n')

        chainedCalls.push(indent(1, multipartBlock))
      } else {
        chainedCalls.push(createChainedCall('body', toRustString(normalizedRequest.postData.text || '')))
      }
    }

    // Add all chained calls to parts
    parts.push(...chainedCalls)

    // Add semicolon to the last part (either request line or last chained call)
    const lastPart = parts[parts.length - 1]
    parts[parts.length - 1] = lastPart + ';'

    parts.push('let response = request.send().await?;')

    return parts.join('\n')
  },
}
