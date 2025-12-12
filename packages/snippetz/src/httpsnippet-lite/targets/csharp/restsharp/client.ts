import { CodeBuilder } from '@/httpsnippet-lite/helpers/code-builder'
import { escapeForDoubleQuotes } from '@/httpsnippet-lite/helpers/escape'
import { getHeader } from '@/httpsnippet-lite/helpers/headers'
import type { Client } from '@/httpsnippet-lite/targets/target'

export const restsharp: Client = {
  info: {
    key: 'restsharp',
    title: 'RestSharp',
    link: 'http://restsharp.org/',
    description: 'Simple REST and HTTP API Client for .NET',
  },
  convert: ({ allHeaders, method, fullUrl, headersObj, cookies, postData }) => {
    const { push, join } = new CodeBuilder()
    const isSupportedMethod = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'].includes(
      method.toUpperCase(),
    )
    if (!isSupportedMethod) {
      return 'Method not supported'
    }
    push(`var client = new RestClient("${fullUrl}");`)
    push(`var request = new RestRequest(Method.${method.toUpperCase()});`)
    // Add headers, including the cookies
    Object.keys(headersObj).forEach((key) => {
      push(`request.AddHeader("${key}", "${escapeForDoubleQuotes(headersObj[key] as string)}");`)
    })
    cookies === null || cookies === void 0
      ? void 0
      : cookies.forEach(({ name, value }) => {
          push(`request.AddCookie("${name}", "${value}");`)
        })
    if (postData === null || postData === void 0 ? void 0 : postData.text) {
      const header = getHeader(allHeaders, 'content-type')
      const text = JSON.stringify(postData!.text)
      push(`request.AddParameter("${header}", ${text}, ParameterType.RequestBody);`)
    }
    push('IRestResponse response = client.Execute(request);')
    return join()
  },
}
