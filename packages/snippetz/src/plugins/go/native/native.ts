import type { Plugin } from '@scalar/types/snippetz'

/**
 * go/native
 */
export const goNative: Plugin = {
  target: 'go',
  client: 'native',
  title: 'NewRequest',
  generate(request, options) {
    // Defaults
    const normalizedRequest = {
      method: 'GET',
      ...request,
    }

    const method = (normalizedRequest.method || 'GET').toUpperCase()
    const url = buildUrl(normalizedRequest.url || '', normalizedRequest.queryString)

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

    if (normalizedRequest.postData) {
      if (
        normalizedRequest.postData.mimeType === 'application/x-www-form-urlencoded' &&
        normalizedRequest.postData.params
      ) {
        needsUrl = true
        needsStrings = true

        const requestBodyLines = [indent('postData := url.Values{}')]
        normalizedRequest.postData.params.forEach(({ name, value }) => {
          requestBodyLines.push(indent(`postData.Set("${escapeString(name)}", "${escapeString(value)}")`))
        })
        requestBodyLines.push(
          '',
          indent(`req, _ := http.NewRequest("${method}", url, strings.NewReader(postData.Encode()))`),
          '',
        )
        requestBody = requestBodyLines.join('\n')
      } else if (normalizedRequest.postData.mimeType === 'multipart/form-data' && normalizedRequest.postData.params) {
        needsBytes = true
        needsMultipart = true
        needsOs = true

        requestBody = `${indent('payload := &bytes.Buffer{}')}\n`
        requestBody += `${indent('writer := multipart.NewWriter(payload)')}\n\n`

        normalizedRequest.postData.params.forEach(({ name, value, fileName }) => {
          if (fileName !== undefined) {
            requestBody += `${indent(`part, _ := writer.CreateFormFile("${escapeString(name)}", "${escapeString(fileName)}")`)}\n\n`
            requestBody += `${indent(`f, _ := os.Open("${escapeString(fileName)}")`)}\n`
            requestBody += `${indent('defer f.Close()')}\n\n`
            requestBody += `${indent('_, _ = io.Copy(part, f)')}\n\n`
          } else {
            requestBody += `${indent(`_ = writer.WriteField("${escapeString(name)}", "${escapeString(value)}")`)}\n`
          }
        })

        requestBody += `${indent('writer.Close()')}\n\n`
        requestBody += `${indent(`req, _ := http.NewRequest("${method}", url, payload)`)}\n\n`
        contentTypeHeader = `${indent('req.Header.Set("Content-Type", writer.FormDataContentType())')}\n`
      } else if (normalizedRequest.postData.text) {
        if (normalizedRequest.postData.mimeType === 'application/json') {
          needsBytes = true
          const formattedJson = formatJson(normalizedRequest.postData.text)
          requestBody = `${indent(`payload := bytes.NewBuffer([]byte(\`${formattedJson}\`))`)}\n\n`
          requestBody += `${indent(`req, _ := http.NewRequest("${method}", url, payload)`)}\n\n`
          contentTypeHeader = `${indent('req.Header.Set("Content-Type", "application/json")')}\n`
        } else {
          needsStrings = true
          requestBody = `${indent(`payload := strings.NewReader("${escapeString(normalizedRequest.postData.text)}")`)}\n\n`
          requestBody += `${indent(`req, _ := http.NewRequest("${method}", url, payload)`)}\n\n`
        }
      }
    } else {
      requestBody = `${indent(`req, _ := http.NewRequest("${method}", url, nil)`)}\n\n`
    }

    // Add required imports
    if (needsStrings) {
      imports.add('strings')
    }
    if (needsBytes) {
      imports.add('bytes')
    }
    if (needsMultipart) {
      imports.add('mime/multipart')
    }
    if (needsUrl) {
      imports.add('net/url')
    }
    if (needsOs) {
      imports.add('os')
    }

    // Build headers
    let headersCode = ''
    if (normalizedRequest.headers && normalizedRequest.headers.length > 0) {
      // Group headers by name and only use the last value for each name
      const headerMap = new Map<string, string>()
      normalizedRequest.headers.forEach(({ name, value }) => {
        headerMap.set(name, value)
      })

      headerMap.forEach((value, name) => {
        headersCode += `${indent(`req.Header.Add("${escapeString(name)}", "${escapeString(value)}")`)}\n`
      })
      headersCode += '\n'
    }

    // Handle cookies
    if (normalizedRequest.cookies && normalizedRequest.cookies.length > 0) {
      const cookieString = normalizedRequest.cookies
        .map(({ name, value }) => `${encodeURIComponent(name)}=${encodeURIComponent(value)}`)
        .join('; ')
      headersCode += `${indent(`req.Header.Add("Cookie", "${escapeString(cookieString)}")`)}\n`
    }

    // Handle basic auth
    let authCode = ''
    if (options?.auth?.username && options?.auth?.password) {
      authCode = `${indent(`req.SetBasicAuth("${escapeString(options.auth.username)}", "${escapeString(options.auth.password)}")`)}\n`
    }

    // Build the complete code
    const importArray = Array.from(imports).sort()
    const importBlock = importArray.map((imp) => indent(`"${imp}"`)).join('\n')

    return `package main

import (
${importBlock}
)

func main() {
${indent(`url := "${escapeString(url)}"`)}

${requestBody}${contentTypeHeader}${headersCode}${authCode}${indent('res, _ := http.DefaultClient.Do(req)')}

${indent('defer res.Body.Close()')}
${indent('body, _ := io.ReadAll(res.Body)')}

${indent('fmt.Println(res)')}
${indent('fmt.Println(string(body))')}

}`
  },
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

  // Convert + back to %20 for spaces to match expected output
  return urlObj.toString().replace(/\+/g, '%20')
}

/**
 * Escapes a string for use in Go double-quoted strings
 */
function escapeString(str: string | undefined): string {
  if (!str) {
    return ''
  }
  return str
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t')
}

/**
 * Creates indented Go code lines using tabs
 */
function indent(lines: string | string[], level: number = 1): string {
  const tab = '\t'
  const indentation = tab.repeat(level)

  if (typeof lines === 'string') {
    return `${indentation}${lines}`
  }

  return lines.map((line) => (line ? `${indentation}${line}` : line)).join('\n')
}

/**
 * Formats JSON with proper indentation for Go code
 */
function formatJson(jsonText: string): string {
  try {
    const parsed = JSON.parse(jsonText)
    return JSON.stringify(parsed, null, 2).replace(/"/g, '\\"').replace(/\n/g, '\\n')
  } catch {
    return escapeString(jsonText)
  }
}
