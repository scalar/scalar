function extractHeaders(headersArray: { name: string; value: string }[]): Record<string, any> {
  const headers: Record<string, any> = {}
  headersArray.forEach((header) => {
    if (headers[header.name] === undefined) {
      headers[header.name] = header.value
    } else if (Array.isArray(headers[header.name])) {
      headers[header.name].push(header.value)
    } else {
      headers[header.name] = [headers[header.name], header.value]
    }
  })
  return headers
}

function extractQueryString(queryStringArray: { name: string; value: string }[]): Record<string, string> {
  const query: Record<string, string> = {}
  queryStringArray.forEach((param) => {
    query[param.name] = param.value
  })
  return query
}

function extractCookies(cookiesArray: { name: string; value: string }[]): Record<string, string> {
  const cookies: Record<string, string> = {}
  cookiesArray.forEach((cookie) => {
    cookies[cookie.name] = cookie.value
  })
  return cookies
}

function turnCookiesToCode(cookies: Record<string, string>, url: string): string {
  let code = '// Cookies\n'
  code += 'let cookieContainer = new CookieContainer()\n'

  for (const [key, value] of Object.entries(cookies)) {
    code += `cookieContainer.Add("${url}", Cookie("${key}", "${value}"))\n`
  }

  code += 'use handler = new HttpClientHandler()\n'
  code += 'handler.CookieContainer <- cookieContainer\n'
  code += 'let client = new HttpClient(handler)\n'
  code += '\n'
  return code
}

function turnHeadersToCode(headers: Record<string, string>): string {
  let code = '// Headers\n'
  for (const [key, value] of Object.entries(headers)) {
    code += `client.DefaultRequestHeaders.Add("${key}", ${value})\n`
  }
  code += '\n'
  return code
}

function turnQueryStringToCode(query: Record<string, string>, url: string): string {
  let code = '// QueryString\n'
  let queryString = ''
  let itteration = 0
  for (const [key, value] of Object.entries(query)) {
    if (itteration === 0) {
      queryString += '?'
    } else {
      queryString += '&'
    }
    queryString += `${key}=${value}`
    itteration++
  }

  code += `client.BaseAddress <- Uri("${url}${queryString}")\n`
  code += '\n'
  return code
}

function turnPostDataToCode(postData: any): string {
  if (!postData) return ''
  let code = ''

  if (postData.mimeType === 'multipart/form-data') {
    code += turnPostDataMultiPartToCode(postData)
  } else if (postData.mimeType === 'application/x-www-form-urlencoded') {
    code += turnPostDataUrlEncodeToCode(postData)
  } else {
    code += turnPostDataToCodeUsingMimeType(postData, postData.mimeType)
  }

  return code
}

function turnPostDataToCodeUsingMimeType(postData: any, contentType: string): string {
  let code = ''
  const json = escapeString(postData.text)
  code += `let content = new StringContent("${json}", Encoding.UTF8, "${contentType}")\n`
  code += `content.Headers.ContentType <- new MediaTypeHeaderValue("${contentType}")\n`
  code += 'let response = client.PostAsync(client.BaseAddress, content).Result\n'
  return code
}

function turnPostDataMultiPartToCode(postData: any): string {
  let code = ''
  code += '// Multipart Form\n'
  code += 'use multipartFormContent = new MultipartFormDataContent()\n'

  let fileCount = 0
  for (const data of postData.params) {
    if (data.value === 'BINARY') {
      code += `let fileStreamContent_${fileCount} = new StreamContent(File.OpenRead("${data.fileName}"))\n`
      code += `fileStreamContent_${fileCount}.Headers.ContentType <- new MediaTypeHeaderValue("${data.contentType}")\n`
      code += `multipartFormContent.Add(fileStreamContent_${fileCount}, "file_${fileCount}", "${data.fileName}")\n`
      fileCount++
    } else {
      code += `multipartFormContent.Add(new StringContent("${data.value}", "${data.name}")\n`
    }
  }
  code += 'let response = client.PostAsync(client.BaseAddress, multipartFormContent).Result\n'
  return code
}

function turnPostDataUrlEncodeToCode(postData: any): string {
  let code = ''
  code += '// Url Encode\n'
  code += 'let formUrlEncodedContentDictionary = new Dictionary<string, string>()\n'

  for (const data of postData.params) {
    code += `formUrlEncodedContentDictionary.Add("${data.value}", "${data.name}")\n`
  }

  code +=
    'let response = client.PostAsync(client.BaseAddress, new FormUrlEncodedContent(formUrlEncodedContentDictionary)).Result\n'
  return code
}

function escapeString(str: string): string {
  return str
    .replace(/\\/g, '\\\\') // Escape backslashes
    .replace(/"/g, '\\"') // Escape double quotes
}

export const httpClientHelpers = {
  extractHeaders,
  extractQueryString,
  extractCookies,

  turnCookiesToCode,
  turnHeadersToCode,
  turnQueryStringToCode,
  turnPostDataToCode,
}
