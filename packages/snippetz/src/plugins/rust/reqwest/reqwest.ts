import type { Plugin } from '@scalar/types/snippetz'
import { toRustString } from '../rustString'

/**
 * rust/reqwest plugin for generating Rust reqwest HTTP client code
 */
export const rustReqwest: Plugin = {
  target: 'rust',
  client: 'reqwest',
  title: 'reqwest',
  generate(request, options?: { auth?: { username: string; password: string } }) {
    // Normalization
    const normalizedRequest = normalizeRequest(request)

    // Query string
    const queryString = buildQueryString(normalizedRequest.queryString)
    const url = buildUrl(normalizedRequest.url, queryString)

    // Headers and cookies
    const headers = processHeaders(normalizedRequest)

    // Chained calls
    const chainedCalls: string[] = []

    // Auth
    const authCall = createAuthCall(options?.auth)
    if (authCall) {
      chainedCalls.push(authCall)
    }

    // Headers
    chainedCalls.push(...createHeaderCalls(headers))

    // Body
    const bodyCall = createBodyCall(normalizedRequest.postData)
    if (bodyCall) {
      chainedCalls.push(bodyCall)
    }

    // Code
    return buildRustCode(url, normalizedRequest.method, chainedCalls)
  },
}

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
 * Formats JSON for Rust's serde_json::json! macro with proper indentation
 */
const formatJsonForRust = (jsonText: string): string => {
  try {
    const jsonData = JSON.parse(jsonText)
    const prettyJson = JSON.stringify(jsonData, null, 4)

    // Split into lines and add proper indentation for Rust
    const lines = prettyJson.split('\n')
    const rustLines = lines.map((line, index) => {
      if (index === 0) {
        // First line (opening brace)
        return line
      }
      if (index === lines.length - 1) {
        // Last line (closing brace)
        return indent(1, line)
      }
      // Middle lines
      return indent(1, line)
    })

    return rustLines.join('\n')
  } catch {
    // If JSON parsing fails, return the original text
    return jsonText
  }
}

/**
 * Normalizes the request object with defaults
 */
const normalizeRequest = (request: any) => {
  return {
    ...request,
    method: (request.method || 'GET').toUpperCase(),
  }
}

/**
 * Builds the query string from request parameters
 */
const buildQueryString = (queryParams?: Array<{ name: string; value: string }>): string => {
  if (!queryParams?.length) {
    return ''
  }

  const queryPairs = queryParams.map((param) => `${encodeURIComponent(param.name)}=${encodeURIComponent(param.value)}`)
  return `?${queryPairs.join('&')}`
}

/**
 * Builds the complete URL with query string
 */
const buildUrl = (baseUrl: string, queryString: string): string => {
  return `${baseUrl}${queryString}`
}

/**
 * Processes headers and cookies into a headers object
 */
const processHeaders = (request: any): Record<string, string> => {
  const headers: Record<string, string> = {}

  // Process regular headers
  if (request.headers) {
    for (const header of request.headers) {
      if (header.value && !/[; ]/.test(header.name)) {
        headers[header.name] = header.value
      }
    }
  }

  // Process cookies
  if (request.cookies?.length > 0) {
    const cookieString = request.cookies
      .map((cookie: any) => `${encodeURIComponent(cookie.name)}=${encodeURIComponent(cookie.value)}`)
      .join('; ')
    headers['Cookie'] = cookieString
  }

  return headers
}

/**
 * Creates authentication chained call if credentials are provided
 */
const createAuthCall = (auth?: { username: string; password: string }): string | null => {
  if (!auth?.username || !auth?.password) {
    return null
  }

  return createChainedCall('basic_auth', toRustString(auth.username), toRustString(auth.password))
}

/**
 * Creates header chained calls from headers object
 */
const createHeaderCalls = (headers: Record<string, string>): string[] => {
  return Object.entries(headers).map(([key, value]) =>
    createChainedCall('header', toRustString(key), toRustString(value)),
  )
}

/**
 * Creates body chained call based on content type
 */
const createBodyCall = (postData: any): string | null => {
  if (!postData) {
    return null
  }

  const { mimeType, text, params } = postData

  switch (mimeType) {
    case 'application/json': {
      const formattedJson = formatJsonForRust(text)
      return createChainedCall('json', `&serde_json::json!(${formattedJson})`)
    }

    case 'application/x-www-form-urlencoded': {
      const formData =
        params?.map((param: any) => `(${toRustString(param.name)}, ${toRustString(param.value || '')})`).join(', ') ||
        ''
      return createChainedCall('form', `&[${formData}]`)
    }

    case 'multipart/form-data': {
      const formParts = params?.map(createMultipartPart).join('\n') || ''
      const multipartBlock = [
        '.multipart({',
        indent(2, 'let mut form = reqwest::multipart::Form::new();'),
        formParts,
        indent(3, 'form'),
        indent(2, '})'),
      ].join('\n')
      return indent(1, multipartBlock)
    }

    default:
      return createChainedCall('body', toRustString(text || ''))
  }
}

/**
 * Builds the complete Rust code by assembling all code
 */
const buildRustCode = (url: string, method: string, chainedCalls: string[]): string => {
  const code = ['let client = reqwest::Client::new();', '']

  // Add chained calls with proper formatting
  if (chainedCalls.length > 0) {
    code.push('let request = client')
    code.push(indent(1, `.${method.toLowerCase()}(${toRustString(url)})`))

    // Add a newline before the first chained call
    code.push(...chainedCalls)
  } else {
    code.push(`let request = client.${method.toLowerCase()}(${toRustString(url)})`)
  }

  // Add semicolon to the last chained call
  const lastPart = code[code.length - 1]
  code[code.length - 1] = lastPart + ';'

  // Add response handling
  code.push('')
  code.push('let response = request.send().await?;')

  return code.join('\n')
}
