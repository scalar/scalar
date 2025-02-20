// @ts-nocheck
import { CodeBuilder } from '../../../helpers/code-builder.js'
import { escapeForDoubleQuotes } from '../../../helpers/escape.js'
import { getHeader } from '../../../helpers/headers.js'

const getDecompressionMethods = (allHeaders) => {
  let acceptEncodings = getHeader(allHeaders, 'accept-encoding')
  if (!acceptEncodings) {
    return [] // no decompression
  }
  const supportedMethods = {
    gzip: 'DecompressionMethods.GZip',
    deflate: 'DecompressionMethods.Deflate',
  }
  const methods = []
  if (typeof acceptEncodings === 'string') {
    acceptEncodings = [acceptEncodings]
  }
  acceptEncodings.forEach((acceptEncoding) => {
    acceptEncoding.split(',').forEach((encoding) => {
      const match = /\s*([^;\s]+)/.exec(encoding)
      if (match) {
        const method = supportedMethods[match[1]]
        if (method) {
          methods.push(method)
        }
      }
    })
  })
  return methods
}
export const httpclient = {
  info: {
    key: 'httpclient',
    title: 'HttpClient',
    link: 'https://docs.microsoft.com/en-us/dotnet/api/system.net.http.httpclient',
    description: '.NET Standard HTTP Client',
  },
  convert: ({ allHeaders, postData, method, fullUrl }, options) => {
    let _a, _b
    const opts = {
      indent: '    ',
      ...options,
    }
    const { push, join } = new CodeBuilder({ indent: opts.indent })
    push('using System.Net.Http.Headers;')
    let clienthandler = ''
    const cookies = Boolean(allHeaders.cookie)
    const decompressionMethods = getDecompressionMethods(allHeaders)
    if (cookies || decompressionMethods.length) {
      clienthandler = 'clientHandler'
      push('var clientHandler = new HttpClientHandler')
      push('{')
      if (cookies) {
        // enable setting the cookie header
        push('UseCookies = false,', 1)
      }
      if (decompressionMethods.length) {
        // enable decompression for supported methods
        push(`AutomaticDecompression = ${decompressionMethods.join(' | ')},`, 1)
      }
      push('};')
    }
    push(`var client = new HttpClient(${clienthandler});`)
    push('var request = new HttpRequestMessage')
    push('{')
    const methods = [
      'GET',
      'POST',
      'PUT',
      'DELETE',
      'PATCH',
      'HEAD',
      'OPTIONS',
      'TRACE',
    ]
    method = method.toUpperCase()
    if (method && methods.includes(method)) {
      // buildin method
      method = `HttpMethod.${method[0]}${method.substring(1).toLowerCase()}`
    } else {
      // custom method
      method = `new HttpMethod("${method}")`
    }
    push(`Method = ${method},`, 1)
    push(`RequestUri = new Uri("${fullUrl}"),`, 1)
    const headers = Object.keys(allHeaders).filter((header) => {
      switch (header.toLowerCase()) {
        case 'content-type':
        case 'content-length':
        case 'accept-encoding':
          // skip these headers
          return false
        default:
          return true
      }
    })
    if (headers.length) {
      push('Headers =', 1)
      push('{', 1)
      headers.forEach((key) => {
        push(`{ "${key}", "${escapeForDoubleQuotes(allHeaders[key])}" },`, 2)
      })
      push('},', 1)
    }
    if (postData === null || postData === void 0 ? void 0 : postData.text) {
      const contentType = postData.mimeType
      switch (contentType) {
        case 'application/x-www-form-urlencoded':
          push(
            'Content = new FormUrlEncodedContent(new Dictionary<string, string>',
            1,
          )
          push('{', 1)
          ;(_a = postData.params) === null || _a === void 0
            ? void 0
            : _a.forEach((param) => {
                push(`{ "${param.name}", "${param.value}" },`, 2)
              })
          push('}),', 1)
          break
        case 'multipart/form-data':
          push('Content = new MultipartFormDataContent', 1)
          push('{', 1)
          ;(_b = postData.params) === null || _b === void 0
            ? void 0
            : _b.forEach((param) => {
                push(
                  `new StringContent(${JSON.stringify(param.value || '')})`,
                  2,
                )
                push('{', 2)
                push('Headers =', 3)
                push('{', 3)
                if (param.contentType) {
                  push(
                    `ContentType = new MediaTypeHeaderValue("${param.contentType}"),`,
                    4,
                  )
                }
                push(
                  'ContentDisposition = new ContentDispositionHeaderValue("form-data")',
                  4,
                )
                push('{', 4)
                push(`Name = "${param.name}",`, 5)
                if (param.fileName) {
                  push(`FileName = "${param.fileName}",`, 5)
                }
                push('}', 4)
                push('}', 3)
                push('},', 2)
              })
          push('},', 1)
          break
        default:
          push(
            `Content = new StringContent(${JSON.stringify((postData === null || postData === void 0 ? void 0 : postData.text) || '')})`,
            1,
          )
          push('{', 1)
          push('Headers =', 2)
          push('{', 2)
          push(`ContentType = new MediaTypeHeaderValue("${contentType}")`, 3)
          push('}', 2)
          push('}', 1)
          break
      }
    }
    push('};')
    // send and read response
    push('using (var response = await client.SendAsync(request))')
    push('{')
    push('response.EnsureSuccessStatusCode();', 1)
    push('var body = await response.Content.ReadAsStringAsync();', 1)
    push('Console.WriteLine(body);', 1)
    push('}')
    return join()
  },
}
