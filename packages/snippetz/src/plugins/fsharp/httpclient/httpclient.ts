import type { Plugin } from '@scalar/types/snippetz'
import { httpClientHelpers } from './httpclient.helpers'

/**
 * fsharp/httpClient
 */

export const fsharpHttpclient: Plugin = {
  target: 'fsharp',
  client: 'httpclient',
  title: 'HttpClient',
  generate: (request, configuration) => {
    if (!request) {
      return ''
    }

    const options: Record<string, any> = {}

    let urlWithPotentialQueryString = request.url
    // handle url
    if (request.url) {
      if (request.queryString && request.queryString.length > 0) {
        const queryString = httpClientHelpers.extractQueryString(request.queryString)
        urlWithPotentialQueryString = `${request.url}=${queryString}`
      }
    }

    // Handle authentication
    if (configuration?.auth?.username && configuration.auth.password) {
      options.auth = [configuration.auth.username, configuration.auth.password]
    }

    // Generate the fsharp code
    let code = ''
    console.log(options, configuration, request)

    // Init the HttpRequestMessage
    code += `let httpRequestMessage = new HttpRequestMessage( HttpMethod("${request.method}"), new Uri("${urlWithPotentialQueryString}"))\n\n`

    // Headers
    if (request.headers) {
      code += httpClientHelpers.turnHeadersToCode(request.headers)
    }

    // PostData
    if (request.postData) {
      code += httpClientHelpers.turnPostDataToCode(request.postData)
    }

    // Cookies
    if (request.cookies && request.cookies.length > 0 && request.url) {
      code += httpClientHelpers.turnCookiesToCode(request.cookies, request.url)

      code += '// Send the request\n'
      code += 'let client = new HttpClient(handler)\n'
    } else {
      code += '// Send the request\n'
      code += 'let client = new HttpClient()\n'
    }

    code += 'let! result = client.SendAsync(httpRequestMessage)\n'

    return code
  },
}
