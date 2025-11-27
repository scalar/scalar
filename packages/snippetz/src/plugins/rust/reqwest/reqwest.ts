import type { Plugin } from '@scalar/types/snippetz'

import { buildQueryString, buildUrl, normalizeRequest, processHeaders } from '@/libs/http'
import { createChain, formatJson, indent, wrapInDoubleQuotes } from '@/libs/rust'

/**
 * rust/reqwest plugin for generating Rust reqwest HTTP client code
 */
export const rustReqwest: Plugin = {
  target: 'rust',
  client: 'reqwest',
  title: 'reqwest',
  generate(request, options?: { auth?: { username: string; password: string } }) {
    if (!request) {
      return ''
    }

    // Normalization
    const normalizedRequest = normalizeRequest(request)

    // Query string
    const queryString = buildQueryString(normalizedRequest.queryString)
    const url = buildUrl(normalizedRequest.url || '', queryString)

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
 * Helper function to create multipart form parts with proper indentation
 */
const createMultipartPart = (param: { name: string; value?: string; fileName?: string }): string => {
  if (param.fileName) {
    return [
      indent(2, `let part = reqwest::multipart::Part::text(${wrapInDoubleQuotes(param.value || '')})`),
      indent(3, `.file_name(${wrapInDoubleQuotes(param.fileName)});`),
      indent(2, `form = form.part(${wrapInDoubleQuotes(param.name)}, part);`),
    ].join('\n')
  }

  return indent(2, `form = form.text(${wrapInDoubleQuotes(param.name)}, ${wrapInDoubleQuotes(param.value || '')});`)
}

/**
 * Creates authentication chained call if credentials are provided
 */
const createAuthCall = (auth?: { username: string; password: string }): string | null => {
  if (!auth?.username || !auth?.password) {
    return null
  }

  return createChain('basic_auth', wrapInDoubleQuotes(auth.username), wrapInDoubleQuotes(auth.password))
}

/**
 * Creates header chained calls from headers object
 */
const createHeaderCalls = (headers: Record<string, string>): string[] => {
  return Object.entries(headers).map(([key, value]) =>
    createChain('header', wrapInDoubleQuotes(key), wrapInDoubleQuotes(value)),
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
      const formattedJson = formatJson(text)
      return createChain('json', `&serde_json::json!(${formattedJson})`)
    }

    case 'application/x-www-form-urlencoded': {
      const formData =
        params
          ?.map((param: any) => `(${wrapInDoubleQuotes(param.name)}, ${wrapInDoubleQuotes(param.value || '')})`)
          .join(', ') || ''
      return createChain('form', `&[${formData}]`)
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
      return createChain('body', wrapInDoubleQuotes(text || ''))
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
    code.push(indent(1, `.${method.toLowerCase()}(${wrapInDoubleQuotes(url)})`))

    // Add a newline before the first chained call
    code.push(...chainedCalls)
  } else {
    code.push(`let request = client.${method.toLowerCase()}(${wrapInDoubleQuotes(url)})`)
  }

  // Add semicolon to the last chained call
  const lastPart = code[code.length - 1]
  code[code.length - 1] = lastPart + ';'

  // Add response handling
  code.push('')
  code.push('let response = request.send().await?;')

  return code.join('\n')
}
