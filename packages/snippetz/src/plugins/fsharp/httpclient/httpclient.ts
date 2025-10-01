import type { Plugin } from '@scalar/types/snippetz'

/**
 * F# HttpClient plugin for generating HTTP request code
 */
export const fsharpHttpclient: Plugin = {
  target: 'fsharp',
  client: 'httpclient',
  title: 'HttpClient',
  generate: (request, _) => {
    if (!request) {
      return ''
    }

    const finalUrl = buildUrlWithQueryString(request.url, request.queryString)
    let code = ''

    // Initialize HttpRequestMessage
    code += generateHttpRequestMessage(request.method, finalUrl)

    // Add headers if present
    if (request.headers && request.headers.length > 0) {
      code += generateHeadersCode(request.headers)
    }

    // Add request body if present
    if (request.postData) {
      code += generatePostDataCode(request.postData)
    }

    // Configure client with cookies if present
    if (request.cookies && request.cookies.length > 0 && request.url) {
      code += generateCookiesCode(request.cookies, request.url)
      code += 'let client = new HttpClient(handler)\n'
    } else {
      code += 'let client = new HttpClient()\n'
    }

    // Send the request
    code += 'let! result = client.SendAsync(httpRequestMessage)\n'

    return code
  },
}

/**
 * Builds a query string from an array of query parameters
 */
function buildQueryString(queryParams: { name: string; value: string }[]): string {
  if (!queryParams || queryParams.length === 0) {
    return ''
  }

  const params = queryParams.map((param) => `${param.name}=${param.value}`)
  return '?' + params.join('&')
}

/**
 * Combines base URL with query string if present
 */
function buildUrlWithQueryString(baseUrl: string | undefined, queryParams?: { name: string; value: string }[]): string {
  if (!baseUrl) {
    return ''
  }

  if (!queryParams || queryParams.length === 0) {
    return baseUrl
  }

  return baseUrl + buildQueryString(queryParams)
}

/**
 * Generates the HttpRequestMessage initialization code
 */
function generateHttpRequestMessage(method: string | undefined, url: string): string {
  return `let httpRequestMessage = new HttpRequestMessage( HttpMethod("${method}"), new Uri("${escapeString(url)}"))\n\n`
}

/**
 * Generates code to add headers to the HttpRequestMessage
 */
function generateHeadersCode(headers: { name: string; value: string }[]): string {
  let code = ''
  for (const header of headers) {
    code += `httpRequestMessage.Headers.Add("${escapeString(header.name ?? '')}", "${escapeString(header.value ?? '')}")\n`
  }
  code += '\n'
  return code
}

/**
 * Generates code to configure cookies for the HttpClient
 */
function generateCookiesCode(cookies: { name: string; value: string }[], url: string): string {
  let code = 'let cookieContainer = CookieContainer()\n'
  for (const cookie of cookies) {
    code += `cookieContainer.Add(Uri("${escapeString(url)}"), Cookie("${escapeString(cookie.name ?? '')}", "${escapeString(cookie.value ?? '')}"))\n`
  }

  code += 'use handler = new HttpClientHandler()\n'
  code += 'handler.CookieContainer <- cookieContainer\n\n'

  return code
}

/**
 * Generates code to set the request content based on postData
 */
function generatePostDataCode(postData: any): string {
  if (!postData) {
    return ''
  }

  let code = ''

  switch (postData.mimeType) {
    case 'multipart/form-data':
      code += generateMultipartFormDataCode(postData)
      break
    case 'application/x-www-form-urlencoded':
      code += generateUrlEncodedFormDataCode(postData)
      break
    case 'application/json':
      code += generateJsonContentCode(postData)
      break
    default:
      code += generateGenericContentCode(postData, postData.mimeType)
      break
  }

  code += 'httpRequestMessage.Content <- content\n\n'
  return code
}

/**
 * Generates code for generic content types
 */
function generateGenericContentCode(postData: any, contentType: string): string {
  let code = `let content = new StringContent("${escapeString(postData.text ?? '')}", Encoding.UTF8, "${escapeString(contentType ?? '')}")\n`
  code += `content.Headers.ContentType <- MediaTypeHeaderValue("${escapeString(contentType ?? '')}")\n`
  return code
}

/**
 * Generates code for multipart/form-data content
 */
function generateMultipartFormDataCode(postData: any): string {
  let code = 'let content = new MultipartFormDataContent()\n'

  let fileIndex = 0
  for (const param of postData.params) {
    if (param.value === 'BINARY') {
      const escapedFileName = escapeString(param.fileName ?? '')
      code += `let fileStreamContent_${fileIndex} = new StreamContent(File.OpenRead("${escapedFileName}"))\n`
      code += `fileStreamContent_${fileIndex}.Headers.ContentType <- MediaTypeHeaderValue("${escapeString(param.contentType ?? '')}")\n`
      code += `content.Add(fileStreamContent_${fileIndex}, "${escapedFileName}", "${escapedFileName}")\n`
      fileIndex++
    } else {
      code += `content.Add(new StringContent("${escapeString(param.value ?? '')}"), "${escapeString(param.name ?? '')}")\n`
    }
  }
  return code
}

/**
 * Generates code for JSON content
 */
function generateJsonContentCode(postData: any): string {
  const prettyJson = JSON.stringify(JSON.parse(postData.text ?? '{}'), null, 2)
  return `let content = new StringContent("${escapeString(prettyJson)}", Encoding.UTF8, "application/json")\n`
}

/**
 * Generates code for application/x-www-form-urlencoded content
 */
function generateUrlEncodedFormDataCode(postData: any): string {
  let code = 'let formUrlEncodedContentDictionary = new Dictionary<string, string>()\n'
  for (const param of postData.params) {
    code += `formUrlEncodedContentDictionary.Add("${escapeString(param.name ?? '')}", "${escapeString(param.value ?? '')}")\n`
  }

  code += 'let content = new FormUrlEncodedContent(formUrlEncodedContentDictionary)\n'
  return code
}

/**
 * Escapes special characters for F# string literals
 */
function escapeString(str: string | undefined): string {
  if (str == null) {
    return ''
  }
  return str
    .replace(/\\/g, '\\\\') // Escape backslashes
    .replace(/"/g, '\\"') // Escape double quotes
    .replace(/\n/g, '\\n') // Escape newlines
    .replace(/\r/g, '\\r') // Escape carriage returns
    .replace(/\t/g, '\\t') // Escape tabs
}
