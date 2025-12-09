/**
 * @description
 * HTTP code snippet generator for Java using Unirest.
 *
 * @author
 * @shashiranjan84
 *
 * for any questions or issues regarding the generated code snippet, please open an issue mentioning the author.
 */

import { CodeBuilder } from '@/httpsnippet-lite/helpers/code-builder'
import { escapeForDoubleQuotes } from '@/httpsnippet-lite/helpers/escape'
import type { Client } from '@/httpsnippet-lite/targets/target'

export const unirest: Client = {
  info: {
    key: 'unirest',
    title: 'Unirest',
    link: 'http://unirest.io/java.html',
    description: 'Lightweight HTTP Request Client Library',
  },
  convert: ({ method, allHeaders, postData, fullUrl }, options) => {
    const opts = {
      indent: '  ',
      ...options,
    }
    const { join, push } = new CodeBuilder({ indent: opts.indent })
    const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']
    if (!methods.includes(method.toUpperCase())) {
      push(`HttpResponse<String> response = Unirest.customMethod("${method.toUpperCase()}","${fullUrl}")`)
    } else {
      push(`HttpResponse<String> response = Unirest.${method.toLowerCase()}("${fullUrl}")`)
    }
    // Add headers, including the cookies
    Object.keys(allHeaders).forEach((key) => {
      push(`.header("${key}", "${escapeForDoubleQuotes(allHeaders[key] as string)}")`, 1)
    })
    if (postData === null || postData === void 0 ? void 0 : postData.text) {
      push(`.body(${JSON.stringify(postData!.text)})`, 1)
    }
    push('.asString();', 1)
    return join()
  },
}
