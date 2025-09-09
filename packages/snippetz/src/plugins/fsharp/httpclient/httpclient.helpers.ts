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
  }
  return code
}

function turnPostDataMultiPartToCode(postData: any): string {
  let code = ''
  code += '// Multipart Form\n'
  code += 'use multipartFormContent = new MultipartFormDataContent()\n'
  if (postData.text) {
    const dataObj = JSON.parse(postData.text)
    let fileCount = 0
    for (const key in dataObj) {
      if (Object.hasOwn(dataObj, key)) {
        const value = dataObj[key]
        if (Object.hasOwn(value, 'type') && value.type === 'file') {
          code += `let fileStreamContent_${fileCount} = new StreamContent(File.OpenRead("${value.name}"))\n`
          code += `fileStreamContent_${fileCount}.Headers.ContentType <- new MediaTypeHeaderValue("${value.mimeType}")\n`
          code += `multipartFormContent.Add(fileStreamContent_${fileCount}, "file_${fileCount}", "${value.name}")\n`
          fileCount++
        } else {
          code += `multipartFormContent.Add(new StringContent("${value}"), "${key}")\n`
        }
      }
    }
  }
  code += 'let response = client.PostAsync(client.BaseAddress, multipartFormContent).Result\n'
  return code
}

function turnPostDataUrlEncodeToCode(postData: any): string {
  let code = ''
  code += '// Url Encode\n'
  code += 'let formUrlEncodedContentDictionary = new Dictionary<string, string>()\n'
  if (postData.text) {
    const splitPostDataText = postData.text.split('&')
    for (const postDataText of splitPostDataText) {
      const splitText = postDataText.split('=')
      if (splitText.length === 2) {
        code += `formUrlEncodedContentDictionary.Add("${splitText[0]}", "${splitText[1]}")\n`
      }
      // need to add error handling for when the split is not 2. Users might put multiple '=' in the value
    }
  }
  code += 'let response = client.PostAsync(client.BaseAddress, new FormUrlEncodedContent(formUrlEncodedContentDictionary)).Result\n'
  return code
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
