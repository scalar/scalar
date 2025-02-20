// @ts-nocheck
import { CodeBuilder } from '../../../helpers/code-builder.js'
import { escapeForDoubleQuotes } from '../../../helpers/escape.js'
import { getHeader } from '../../../helpers/headers.js'

export const restsharp = {
  info: {
    key: 'restsharp',
    title: 'RestSharp',
    link: 'http://restsharp.org/',
    description: 'Simple REST and HTTP API Client for .NET',
  },
  convert: ({ allHeaders, method, fullUrl, headersObj, cookies, postData }) => {
    const { push, join } = new CodeBuilder()
    const isSupportedMethod = [
      'GET',
      'POST',
      'PUT',
      'DELETE',
      'PATCH',
      'HEAD',
      'OPTIONS',
    ].includes(method.toUpperCase())
    if (!isSupportedMethod) {
      return 'Method not supported'
    }
    push(`var client = new RestClient("${fullUrl}");`)
    push(`var request = new RestRequest(Method.${method.toUpperCase()});`)
    // Add headers, including the cookies
    Object.keys(headersObj).forEach((key) => {
      push(
        `request.AddHeader("${key}", "${escapeForDoubleQuotes(headersObj[key])}");`,
      )
    })
    cookies === null || cookies === void 0
      ? void 0
      : cookies.forEach(({ name, value }) => {
          push(`request.AddCookie("${name}", "${value}");`)
        })
    if (postData === null || postData === void 0 ? void 0 : postData.text) {
      const header = getHeader(allHeaders, 'content-type')
      const text = JSON.stringify(postData.text)
      push(
        `request.AddParameter("${header}", ${text}, ParameterType.RequestBody);`,
      )
    }
    push('IRestResponse response = client.Execute(request);')
    return join()
  },
}
