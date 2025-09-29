import type { Plugin } from '@scalar/types/snippetz'

/**
 * fsharp/httpClient
 */

export const fsharpHttpclient: Plugin = {
  target: 'fsharp',
  client: 'httpclient',
  title: 'HttpClient',
  generate: (request, _) => {
    if (!request) {
      return ''
    }

    let urlWithPotentialQueryString = request.url
    // handle url
    if (request.url) {
      if (request.queryString && request.queryString.length > 0) {
        const queryString = extractQueryString(request.queryString)
        urlWithPotentialQueryString = `${request.url}${queryString}`
      }
    } else {
      urlWithPotentialQueryString = ''
    }

    // Generate the fsharp code
    let code = ''

    // Init the HttpRequestMessage
    code += `let httpRequestMessage = new HttpRequestMessage( HttpMethod("${request.method}"), new Uri("${urlWithPotentialQueryString}"))\n\n`

    // Headers
    if (request.headers) {
      code += turnHeadersToCode(request.headers)
    }

    // PostData
    if (request.postData) {
      code += turnPostDataToCode(request.postData)
    }

    // Cookies
    if (request.cookies && request.cookies.length > 0 && request.url) {
      code += turnCookiesToCode(request.cookies, request.url)

      code += 'let client = new HttpClient(handler)\n'
    } else {
      code += 'let client = new HttpClient()\n'
    }

    code += 'let! result = client.SendAsync(httpRequestMessage)\n'

    return code
  },
}

function extractQueryString(queryStringArray: { name: string; value: string }[]): string {
  let queryString = ''
  let itteration = 0
  queryStringArray.forEach((param) => {
    if (itteration === 0) {
      queryString += '?'
    } else {
      queryString += '&'
    }
    queryString += `${param.name}=${param.value}`
    itteration++
  })
  return queryString
}

function turnHeadersToCode(headersArray: { name: string; value: string }[]): string {
  let code = ''
  for (const header of headersArray) {
    code += `httpRequestMessage.Headers.Add("${header.name}", "${header.value}")\n`
  }
  code += '\n'
  return code
}

function turnCookiesToCode(cookies: { name: string; value: string }[], url: string): string {
  let code = 'let cookieContainer = CookieContainer()\n'
  for (const cookie of cookies) {
    code += `cookieContainer.Add(Uri("${escapeString(url)}"), Cookie("${escapeString(cookie.name)}", "${escapeString(cookie.value)}"))\n`
  }

  code += 'use handler = new HttpClientHandler()\n'
  code += 'handler.CookieContainer <- cookieContainer\n\n'

  return code
}

function turnPostDataToCode(postData: any): string {
  if (!postData) return ''
  let code = ''

  if (postData.mimeType === 'multipart/form-data') {
    code += turnPostDataMultiPartToCode(postData)
  } else if (postData.mimeType === 'application/x-www-form-urlencoded') {
    code += turnPostDataUrlEncodeToCode(postData)
  } else if (postData.mimeType === 'application/json') {
    code += turnPostDataJsonToCode(postData)
  } else {
    code += turnPostDataToCodeUsingMimeType(postData, postData.mimeType)
  }

  code += 'httpRequestMessage.Content <- content\n\n'
  return code
}

function turnPostDataToCodeUsingMimeType(postData: any, contentType: string): string {
  let code = `let content = new StringContent("${escapeString(postData.text)}", Encoding.UTF8, "${contentType}")\n`
  code += `content.Headers.ContentType <- MediaTypeHeaderValue("${contentType}")\n`
  return code
}

function turnPostDataMultiPartToCode(postData: any): string {
  let code = 'let content = new MultipartFormDataContent()\n'

  let fileCount = 0
  for (const data of postData.params) {
    if (data.value === 'BINARY') {
      const escapedFileName = escapeString(data.fileName)
      code += `let fileStreamContent_${fileCount} = new StreamContent(File.OpenRead("${escapedFileName}"))\n`
      code += `fileStreamContent_${fileCount}.Headers.ContentType <- MediaTypeHeaderValue("${data.contentType}")\n`
      code += `content.Add(fileStreamContent_${fileCount}, "${escapedFileName}", "${escapedFileName}")\n`
      fileCount++
    } else {
      code += `content.Add(new StringContent("${escapeString(data.value)}"), "${escapeString(data.name)}")\n`
    }
  }
  return code
}

function turnPostDataJsonToCode(postData: any): string {
  const prettyJson = `${JSON.stringify(JSON.parse(postData.text), null, 2)}\n`
  return `let content = new StringContent("${escapeStringLite(prettyJson)}", Encoding.UTF8, "application/json")\n`
}

function turnPostDataUrlEncodeToCode(postData: any): string {
  let code = 'let formUrlEncodedContentDictionary = new Dictionary<string, string>()\n'
  for (const data of postData.params) {
    code += `formUrlEncodedContentDictionary.Add("${escapeString(data.name)}", "${escapeString(data.value)}")\n`
  }

  code += 'let content = new FormUrlEncodedContent(formUrlEncodedContentDictionary)\n'
  return code
}

function escapeString(str: string): string {
  return str
    .replace(/\\/g, '\\\\') // Escape backslashes
    .replace(/"/g, '\\"') // Escape double quotes
    .replace(/\n/g, '\\n') // Escape newlines
    .replace(/\r/g, '\\r') // Escape carriage returns
    .replace(/\t/g, '\\t') // Escape tabs
}

function escapeStringLite(str: string): string {
  return str
    .replace(/\\/g, '\\\\') // Escape backslashes
    .replace(/"/g, "'") // replace double quotes with single quotes
}
