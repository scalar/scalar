// @ts-nocheck
/**
 * @description
 * HTTP code snippet generator for Java using OkHttp.
 *
 * @author
 * @shashiranjan84
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
  convert: ({ postData, method, fullUrl, allHeaders }, options) => {
    const opts = {
      indent: '  ',
      ...options,
    }
    const { push, blank, join } = new CodeBuilder({ indent: opts.indent })
    const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD']
    const methodsWithBody = ['POST', 'PUT', 'DELETE', 'PATCH']
    push('OkHttpClient client = new OkHttpClient();')
    blank()
    if (postData !== null && postData !== void 0) {
      if (postData.mimeType === 'application/x-www-form-urlencoded' && postData.params) {
        push('FormBody formBody = new FormBody.Builder()')
        postData.params.forEach((param) => {
          push(`.addEncoded("${param.name}", "${param.value}")`, 1)
        })
        push('.build();', 1)
        blank()
      } else if (postData.mimeType === 'multipart/form-data' && postData.params) {
        push(`MultipartBody body = new MultipartBody.Builder()`)
        push(`.setType(MultipartBody.FORM)`, 1)
        postData.params.forEach((param) => {
          if (param.fileName !== undefined) {
            push(
              `.addFormDataPart("${param.name}", "${param.fileName}", RequestBody.create(MediaType.parse("application/octet-stream"), new File("${param.fileName}")))`,
              1,
            )
          } else if (param.value !== undefined) {
            push(`.addFormDataPart("${param.name}", "${param.value}")`, 1)
          }
        })
        push('.build();', 1)
        blank()
      } else {
        push(`MediaType mediaType = MediaType.parse("${postData.mimeType}");`)
        push(`RequestBody body = RequestBody.create(mediaType, ${JSON.stringify(postData.text)});`)
      }
    }
    push('Request request = new Request.Builder()')
    push(`.url("${fullUrl}")`, 1)
    if (!methods.includes(method.toUpperCase())) {
      if (postData === null || postData === void 0 ? void 0 : postData.text) {
        push(`.method("${method.toUpperCase()}", body)`, 1)
      } else {
        push(`.method("${method.toUpperCase()}", null)`, 1)
      }
    } else if (methodsWithBody.includes(method.toUpperCase())) {
      if (postData === null || postData === void 0 ? void 0 : postData.text || postData.params) {
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
    push('.build();', 1)
    blank()
    push('Response response = client.newCall(request).execute();')
    return join()
  },
}
