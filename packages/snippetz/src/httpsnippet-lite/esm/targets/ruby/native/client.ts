// @ts-nocheck
import { CodeBuilder } from '../../../helpers/code-builder.js'
import { escapeForSingleQuotes } from '../../../helpers/escape.js'

export const native = {
  info: {
    key: 'native',
    title: 'net::http',
    link: 'http://ruby-doc.org/stdlib-2.2.1/libdoc/net/http/rdoc/Net/HTTP.html',
    description: 'Ruby HTTP client',
  },
  convert: (
    { uriObj, method: rawMethod, fullUrl, postData, allHeaders },
    options = {},
  ) => {
    const { insecureSkipVerify = false } = options
    const { push, blank, join } = new CodeBuilder()
    push("require 'uri'")
    push("require 'net/http'")
    blank()
    // To support custom methods we check for the supported methods
    // and if doesn't exist then we build a custom class for it
    const method = rawMethod.toUpperCase()
    const methods = [
      'GET',
      'POST',
      'HEAD',
      'DELETE',
      'PATCH',
      'PUT',
      'OPTIONS',
      'COPY',
      'LOCK',
      'UNLOCK',
      'MOVE',
      'TRACE',
    ]
    const capMethod = method.charAt(0) + method.substring(1).toLowerCase()
    if (!methods.includes(method)) {
      push(`class Net::HTTP::${capMethod} < Net::HTTPRequest`)
      push(`  METHOD = '${method.toUpperCase()}'`)
      push(
        `  REQUEST_HAS_BODY = '${(postData === null || postData === void 0 ? void 0 : postData.text) ? 'true' : 'false'}'`,
      )
      push('  RESPONSE_HAS_BODY = true')
      push('end')
      blank()
    }
    push(`url = URI("${fullUrl}")`)
    blank()
    push('http = Net::HTTP.new(url.host, url.port)')
    if (uriObj.protocol === 'https:') {
      push('http.use_ssl = true')
      if (insecureSkipVerify) {
        push('http.verify_mode = OpenSSL::SSL::VERIFY_NONE')
      }
    }
    blank()
    push(`request = Net::HTTP::${capMethod}.new(url)`)
    const headers = Object.keys(allHeaders)
    if (headers.length) {
      headers.forEach((key) => {
        push(`request["${key}"] = '${escapeForSingleQuotes(allHeaders[key])}'`)
      })
    }
    if (postData === null || postData === void 0 ? void 0 : postData.text) {
      push(`request.body = ${JSON.stringify(postData.text)}`)
    }
    blank()
    push('response = http.request(request)')
    push('puts response.read_body')
    return join()
  },
}
