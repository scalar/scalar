// @ts-nocheck
/**
 * @description
 * HTTP code snippet generator for Kotlin using OkHttp.
 *
 * @author
 * @seanghay
 *
 * for any questions or issues regarding the generated code snippet, please open an issue mentioning the author.
 */
import { CodeBuilder } from '../../../helpers/code-builder.js'
import { escapeForDoubleQuotes } from '../../../helpers/escape.js'

export const okhttp = {
  info: {
    key: 'okhttp',
    title: 'OkHttp',
    link: 'http://square.github.io/okhttp/',
    description: 'An HTTP Request Client Library',
  },
  convert: ({ postData, fullUrl, method, allHeaders }, options) => {
    const opts = {
      indent: '  ',
      ...options,
    }
    const { blank, join, push } = new CodeBuilder({ indent: opts.indent })
    const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD']
    const methodsWithBody = ['POST', 'PUT', 'DELETE', 'PATCH']
    push('val client = OkHttpClient()')
    blank()
    if (postData === null || postData === void 0 ? void 0 : postData.text) {
      if (postData.boundary) {
        push(
          `val mediaType = MediaType.parse("${postData.mimeType}; boundary=${postData.boundary}")`,
        )
      } else {
        push(`val mediaType = MediaType.parse("${postData.mimeType}")`)
      }
      push(
        `val body = RequestBody.create(mediaType, ${JSON.stringify(postData.text)})`,
      )
    }
    push('val request = Request.Builder()')
    push(`.url("${fullUrl}")`, 1)
    if (!methods.includes(method.toUpperCase())) {
      if (postData === null || postData === void 0 ? void 0 : postData.text) {
        push(`.method("${method.toUpperCase()}", body)`, 1)
      } else {
        push(`.method("${method.toUpperCase()}", null)`, 1)
      }
    } else if (methodsWithBody.includes(method.toUpperCase())) {
      if (postData === null || postData === void 0 ? void 0 : postData.text) {
        push(`.${method.toLowerCase()}(body)`, 1)
      } else {
        push(`.${method.toLowerCase()}(null)`, 1)
      }
    } else {
      push(`.${method.toLowerCase()}()`, 1)
    }
    // Add headers, including the cookies
    Object.keys(allHeaders).forEach((key) => {
      push(
        `.addHeader("${key}", "${escapeForDoubleQuotes(allHeaders[key])}")`,
        1,
      )
    })
    push('.build()', 1)
    blank()
    push('val response = client.newCall(request).execute()')
    return join()
  },
}
