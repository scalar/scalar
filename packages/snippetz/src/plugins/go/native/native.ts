import type { Plugin } from '@scalar/types/snippetz'
import type { HarRequest } from '@scalar/types/snippetz'

/**
 * Escapes a string for use in Go double-quoted strings
 */
function escapeForGoString(str: string | undefined): string {
  if (!str) return ''
  return str
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t')
}

/**
 * Formats JSON with proper indentation for Go code
 */
function formatJsonForGo(jsonText: string): string {
  try {
    const parsed = JSON.parse(jsonText)
    return JSON.stringify(parsed, null, 2).replace(/"/g, '\\"').replace(/\n/g, '\\n')
  } catch {
    return escapeForGoString(jsonText)
  }
}

/**
 * Builds the URL with query parameters
 */
function buildUrl(url: string, queryString?: Array<{ name: string; value: string }>): string {
  if (!queryString || queryString.length === 0) {
    return url
  }

  const urlObj = new URL(url)
  queryString.forEach(({ name, value }) => {
    urlObj.searchParams.set(name, value)
  })

  return urlObj.toString()
}

/**
 * Generates Go code for a request
 */
function generateGoCode(
  request: Partial<HarRequest>,
  options?: { auth?: { username: string; password: string } },
): string {
  const method = (request.method || 'GET').toUpperCase()
  const url = buildUrl(request.url || '', request.queryString)

  // Determine required imports
  const imports = new Set(['fmt', 'io', 'net/http'])

  // Check if we need additional imports based on request content
  let needsStrings = false
  let needsBytes = false
  let needsMultipart = false
  let needsUrl = false
  let needsOs = false

  // Handle post data
  let requestBody = ''
  let contentTypeHeader = ''

  if (request.postData) {
    if (request.postData.mimeType === 'application/x-www-form-urlencoded' && request.postData.params) {
      needsUrl = true
      needsStrings = true

      requestBody = '\tpostData := url.Values{}\n'
      request.postData.params.forEach(({ name, value }) => {
        requestBody += `\tpostData.Set("${escapeForGoString(name)}", "${escapeForGoString(value)}")\n`
      })
      requestBody += `\n\treq, _ := http.NewRequest("${method}", url, strings.NewReader(postData.Encode()))\n\n`
    } else if (request.postData.mimeType === 'multipart/form-data' && request.postData.params) {
      needsBytes = true
      needsMultipart = true
      needsOs = true

      requestBody = '\tpayload := &bytes.Buffer{}\n'
      requestBody += '\twriter := multipart.NewWriter(payload)\n\n'

      request.postData.params.forEach(({ name, value, fileName }) => {
        if (fileName !== undefined) {
          requestBody += `\tpart, _ := writer.CreateFormFile("${escapeForGoString(name)}", "${escapeForGoString(fileName)}")\n\n`
          requestBody += `\tf, _ := os.Open("${escapeForGoString(fileName)}")\n`
          requestBody += '\tdefer f.Close()\n\n'
          requestBody += '\t_, _ = io.Copy(part, f)\n\n'
        } else {
          requestBody += `\t_ = writer.WriteField("${escapeForGoString(name)}", "${escapeForGoString(value)}")\n`
        }
      })

      requestBody += '\twriter.Close()\n\n'
      requestBody += `\treq, _ := http.NewRequest("${method}", url, payload)\n\n`
      contentTypeHeader = `\treq.Header.Set("Content-Type", writer.FormDataContentType())\n`
    } else if (request.postData.text) {
      if (request.postData.mimeType === 'application/json') {
        needsBytes = true
        const formattedJson = formatJsonForGo(request.postData.text)
        requestBody = `\tpayload := bytes.NewBuffer([]byte(\`${formattedJson}\`))\n\n`
        requestBody += `\treq, _ := http.NewRequest("${method}", url, payload)\n\n`
        contentTypeHeader = `\treq.Header.Set("Content-Type", "application/json")\n`
      } else {
        needsStrings = true
        requestBody = `\tpayload := strings.NewReader("${escapeForGoString(request.postData.text)}")\n\n`
        requestBody += `\treq, _ := http.NewRequest("${method}", url, payload)\n\n`
      }
    }
  } else {
    requestBody = `\treq, _ := http.NewRequest("${method}", url, nil)\n\n`
  }

  // Add required imports
  if (needsStrings) imports.add('strings')
  if (needsBytes) imports.add('bytes')
  if (needsMultipart) imports.add('mime/multipart')
  if (needsUrl) imports.add('net/url')
  if (needsOs) imports.add('os')

  // Build headers
  let headersCode = ''
  if (request.headers && request.headers.length > 0) {
    request.headers.forEach(({ name, value }) => {
      headersCode += `\treq.Header.Add("${escapeForGoString(name)}", "${escapeForGoString(value)}")\n`
    })
    headersCode += '\n'
  }

  // Handle cookies
  if (request.cookies && request.cookies.length > 0) {
    const cookieString = request.cookies
      .map(({ name, value }) => `${encodeURIComponent(name)}=${encodeURIComponent(value)}`)
      .join('; ')
    headersCode += `\treq.Header.Add("Cookie", "${escapeForGoString(cookieString)}")\n`
  }

  // Handle basic auth
  let authCode = ''
  if (options?.auth?.username && options?.auth?.password) {
    authCode = `\treq.SetBasicAuth("${escapeForGoString(options.auth.username)}", "${escapeForGoString(options.auth.password)}")\n`
  }

  // Build the complete code
  const importArray = Array.from(imports).sort()
  const importBlock = importArray.map((imp) => `\t"${imp}"`).join('\n')

  return `package main

import (
${importBlock}
)

func main() {
\turl := "${escapeForGoString(url)}"

${requestBody}${contentTypeHeader}${headersCode}${authCode}\tres, _ := http.DefaultClient.Do(req)

\tdefer res.Body.Close()
\tbody, _ := io.ReadAll(res.Body)

\tfmt.Println(res)
\tfmt.Println(string(body))

}`
}

/**
 * go/native
 */
export const goNative: Plugin = {
  target: 'go',
  client: 'native',
  title: 'NewRequest',
  generate(request, options) {
    return generateGoCode(request, options)
  },
}
