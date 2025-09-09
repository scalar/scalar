import type { Plugin } from '@scalar/types/snippetz'
import { httpClientHelpers } from './httpclient.helpers'

/**
 * fsharp/httpClient
 */
export const fsharpHttpclient: Plugin = {
  target: 'fsharp',
  client: 'httpclient',
  title: 'HttpClient',
  generate(request, configuration) {
    if (!request) {
      return ''
    }

    const options: Record<string, any> = {}
    const url = request.url || ''

    // Handle headers
    if (request.headers && Array.isArray(request.headers) && request.headers.length > 0) {
      options.headers = httpClientHelpers.extractHeaders(request.headers)
    }

    // Handle query parameters
    if (request.queryString && request.queryString.length > 0) {
      options.query = httpClientHelpers.extractQueryString(request.queryString)
    }

    // Handle cookies
    if (request.cookies && request.cookies.length > 0) {
      options.cookies = httpClientHelpers.extractCookies(request.cookies)
    }

    // Handle authentication
    if (configuration?.auth?.username && configuration.auth.password) {
      options.auth = [configuration.auth.username, configuration.auth.password]
    }

    // Generate the fsharp code
    let code = ''
    console.log(options, configuration, request)
    if (Object.keys(options).length > 0) {
      // If we have cookies, we need to create a cookie container and a handler
      // otherwise, we can just create the client
      if (options.cookies && Object.keys(options.cookies).length > 0) {
        code += httpClientHelpers.turnCookiesToCode(options.cookies, url)
      } else {
        code += 'let client = new HttpClient()\n'
      }

      // If we have a query string, we need to append it to the URL
      // otherwise, we can just set the base address
      if (options.query && Object.keys(options.query).length > 0) {
        code += httpClientHelpers.turnQueryStringToCode(options.query, url)
      } else {
        code += `client.BaseAddress <- Uri("${url}")\n`
      }

      if (options.headers && Object.keys(options.headers).length > 0) {
        code += httpClientHelpers.turnHeadersToCode(options.headers)
      }

      if (request.postData) {
        code += httpClientHelpers.turnPostDataToCode(request.postData)
      }
    } else {
      code += 'let client = new HttpClient()\n'
      code += `client.BaseAddress <- Uri("${url}")\n`
    }

    return code
  },
}
