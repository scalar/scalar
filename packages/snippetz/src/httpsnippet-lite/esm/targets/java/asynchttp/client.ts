// @ts-nocheck
/**
 * @description
 * Asynchronous Http and WebSocket Client library for Java
 *
 * @author
 * @windard
 *
 * for any questions or issues regarding the generated code snippet, please open an issue mentioning the author.
 */
import { CodeBuilder } from '../../../helpers/code-builder.js'
import { escapeForDoubleQuotes } from '../../../helpers/escape.js'

export const asynchttp = {
  info: {
    key: 'asynchttp',
    title: 'AsyncHttp',
    link: 'https://github.com/AsyncHttpClient/async-http-client',
    description: 'Asynchronous Http and WebSocket Client library for Java',
  },
  convert: ({ method, allHeaders, postData, fullUrl }, options) => {
    const opts = {
      indent: '  ',
      ...options,
    }
    const { blank, push, join } = new CodeBuilder({ indent: opts.indent })
    push('AsyncHttpClient client = new DefaultAsyncHttpClient();')
    push(`client.prepare("${method.toUpperCase()}", "${fullUrl}")`)
    // Add headers, including the cookies
    Object.keys(allHeaders).forEach((key) => {
      push(
        `.setHeader("${key}", "${escapeForDoubleQuotes(allHeaders[key])}")`,
        1,
      )
    })
    if (postData === null || postData === void 0 ? void 0 : postData.text) {
      push(`.setBody(${JSON.stringify(postData.text)})`, 1)
    }
    push('.execute()', 1)
    push('.toCompletableFuture()', 1)
    push('.thenAccept(System.out::println)', 1)
    push('.join();', 1)
    blank()
    push('client.close();')
    return join()
  },
}
