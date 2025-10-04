import type { Plugin, PluginConfiguration } from '@scalar/types/snippetz'
import { encode } from 'js-base64'

import { createSearchParams } from '@/utils/create-search-params'

/**
 * csharp/httpclient
 */
export const csharpHttpclient: Plugin = {
  target: 'csharp',
  client: 'httpclient',
  title: 'HttpClient',
  generate(request, configuration) {
    // Defaults
    const normalizedRequest = {
      method: 'GET',
      url: '',
      ...request,
    }

    // Normalization
    normalizedRequest.method = normalizedRequest.method.toUpperCase()

    // Build URL with query string
    const searchParams = createSearchParams(normalizedRequest.queryString)
    const queryString = searchParams.size ? `?${searchParams.toString()}` : ''

    const url = `${normalizedRequest.url}${queryString}`

    // Start building the snippet
    const lines: string[] = []

    // HttpClient declaration
    lines.push('using var client = new HttpClient();')
    lines.push('')

    // HttpRequestMessage
    const httpMethod = getHttpMethod(normalizedRequest.method)
    lines.push(`var request = new HttpRequestMessage(${httpMethod}, "${url}");`)

    // Headers and auth
    addHeadersAndAuth(lines, normalizedRequest, configuration)

    // Body content
    addBodyContent(lines, normalizedRequest)

    // Send request and read response
    lines.push('')
    lines.push('using var response = await client.SendAsync(request);')
    lines.push('response.EnsureSuccessStatusCode();')
    lines.push('var body = await response.Content.ReadAsStringAsync();')

    return lines.join('\n')
  },
}

/**
 * Convert HTTP method to HttpMethod constant
 */
function getHttpMethod(method: string): string {
  switch (method) {
    case 'GET':
      return 'HttpMethod.Get'
    case 'POST':
      return 'HttpMethod.Post'
    case 'PUT':
      return 'HttpMethod.Put'
    case 'DELETE':
      return 'HttpMethod.Delete'
    case 'PATCH':
      return 'HttpMethod.Patch'
    case 'HEAD':
      return 'HttpMethod.Head'
    case 'OPTIONS':
      return 'HttpMethod.Options'
    default:
      return `new HttpMethod("${method}")`
  }
}

/**
 * Add headers and authentication to the request
 */
function addHeadersAndAuth(lines: string[], request: any, configuration?: PluginConfiguration): void {
  const headers = request.headers || []
  const cookies = request.cookies || []

  // Check for explicit Authorization header first
  const authHeader = headers.find((h: any) => h.name.toLowerCase() === 'authorization')

  if (authHeader) {
    const [scheme, parameter] = authHeader.value.split(' ', 2)
    if (scheme && parameter) {
      lines.push(`request.Headers.Authorization = new AuthenticationHeaderValue("${scheme}", "${parameter}");`)
    }
  } else if (configuration?.auth?.username && configuration?.auth?.password) {
    // Use configuration auth if no explicit header
    const credentials = encode(`${configuration.auth.username}:${configuration.auth.password}`)
    lines.push(`request.Headers.Authorization = new AuthenticationHeaderValue("Basic", "${credentials}");`)
  }

  // Process other headers (keep only the last value for duplicates)
  const processedHeaders = new Map<string, string>()
  for (const header of headers) {
    const name = header.name
    const value = header.value

    if (name.toLowerCase() === 'authorization') {
      // Already handled above
      continue
    }

    processedHeaders.set(name, value)
  }

  for (const [name, value] of processedHeaders) {
    if (name.toLowerCase() === 'accept' && isMediaType(value)) {
      lines.push(`request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("${value}"));`)
    } else if (name.toLowerCase() === 'content-type' && request.postData) {
      // Content-Type will be set on content object
      continue
    } else {
      lines.push(`request.Headers.TryAddWithoutValidation("${name}", "${value}");`)
    }
  }

  // Add cookies
  if (cookies.length > 0) {
    const cookieString = cookies.map((cookie: any) => `${cookie.name}=${cookie.value}`).join('; ')
    lines.push(`request.Headers.TryAddWithoutValidation("Cookie", "${cookieString}");`)
  }
}

/**
 * Add body content to the request
 */
function addBodyContent(lines: string[], request: any): void {
  if (!request.postData) {
    return
  }

  const { mimeType, text, params } = request.postData

  if (mimeType === 'application/json' && text) {
    try {
      const jsonData = JSON.parse(text)
      const prettyJson = JSON.stringify(jsonData, null, 2)
      const rawStringLiteral = createRawStringLiteral(prettyJson)
      lines.push('request.Content = new StringContent(')
      lines.push(`${rawStringLiteral},`)
      lines.push('System.Text.Encoding.UTF8, "application/json");')
    } catch {
      const rawStringLiteral = createRawStringLiteral(text)
      lines.push('request.Content = new StringContent(')
      lines.push(`${rawStringLiteral},`)
      lines.push('System.Text.Encoding.UTF8, "application/json");')
    }
  } else if (mimeType === 'application/x-www-form-urlencoded' && params) {
    // Check for duplicate field names
    const fieldNames = params.map((p: any) => p.name)
    const hasDuplicates = fieldNames.length !== new Set(fieldNames).size

    if (hasDuplicates) {
      // Use List<KeyValuePair> for duplicates
      lines.push('var formParams = new List<KeyValuePair<string, string>>')
      lines.push('{')
      for (const param of params) {
        lines.push(`  new("${param.name}", "${param.value}"),`)
      }
      lines.push('};')
      lines.push('request.Content = new FormUrlEncodedContent(formParams);')
    } else {
      // Use Dictionary for clean syntax
      lines.push('var formParams = new Dictionary<string, string>')
      lines.push('{')
      for (const param of params) {
        lines.push(`  ["${param.name}"] = "${param.value}",`)
      }
      lines.push('};')
      lines.push('request.Content = new FormUrlEncodedContent(formParams);')
    }
  } else if (mimeType === 'multipart/form-data' && params) {
    lines.push('var content = new MultipartFormDataContent();')
    for (const param of params) {
      if (param.fileName !== undefined) {
        lines.push(
          `content.Add(new StreamContent(File.OpenRead("${param.fileName}")), "${param.name}", "${param.fileName}");`,
        )
      } else {
        lines.push(`content.Add(new StringContent("${param.value}"), "${param.name}");`)
      }
    }
    lines.push('request.Content = content;')
  } else if (mimeType === 'application/octet-stream' && text) {
    lines.push(
      'var content = new ByteArrayContent(System.Text.Encoding.UTF8.GetBytes("' + text.replace(/"/g, '\\"') + '"));',
    )
    lines.push('content.Headers.ContentType = new MediaTypeHeaderValue("application/octet-stream");')
    lines.push('request.Content = content;')
  } else if (text) {
    // Fallback for other content types
    const rawStringLiteral = createRawStringLiteral(text)
    lines.push('request.Content = new StringContent(')
    lines.push(`${rawStringLiteral},`)
    lines.push(`System.Text.Encoding.UTF8, "${mimeType}");`)
  }
}

/**
 * Create a C# raw string literal with minimal quote count
 */
function createRawStringLiteral(text: string): string {
  // Find the minimum number of quotes needed
  let quoteCount = 3
  while (text.includes('"'.repeat(quoteCount))) {
    quoteCount++
  }

  const quotes = '"'.repeat(quoteCount)
  return `${quotes}\n${text}\n${quotes}`
}

/**
 * Check if a value looks like a media type
 */
function isMediaType(value: string): boolean {
  return /^[a-zA-Z0-9][a-zA-Z0-9!#$&\-\^_]*\/[a-zA-Z0-9][a-zA-Z0-9!#$&\-\^_]*(\s*;\s*[a-zA-Z0-9][a-zA-Z0-9!#$&\-\^_]*=.*)?$/.test(
    value,
  )
}
