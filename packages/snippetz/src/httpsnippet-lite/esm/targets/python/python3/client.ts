// @ts-nocheck
/**
 * @description
 * HTTP code snippet generator for native Python3.
 *
 * @author
 * @montanaflynn
 *
 * for any questions or issues regarding the generated code snippet, please open an issue mentioning the author.
 */
import { CodeBuilder } from '../../../helpers/code-builder.js'
import { escapeForDoubleQuotes } from '../../../helpers/escape.js'

export const python3 = {
  info: {
    key: 'python3',
    title: 'http.client',
    link: 'https://docs.python.org/3/library/http.client.html',
    description: 'Python3 HTTP Client',
  },
  convert: (
    { uriObj: { path, protocol, host }, postData, allHeaders, method },
    options = {},
  ) => {
    const { insecureSkipVerify = false } = options
    const { push, blank, join } = new CodeBuilder()
    // Start Request
    push('import http.client')
    if (insecureSkipVerify) {
      push('import ssl')
    }
    blank()
    // Check which protocol to be used for the client connection
    if (protocol === 'https:') {
      const sslContext = insecureSkipVerify
        ? ', context = ssl._create_unverified_context()'
        : ''
      push(`conn = http.client.HTTPSConnection("${host}"${sslContext})`)
      blank()
    } else {
      push(`conn = http.client.HTTPConnection("${host}")`)
      blank()
    }
    // Create payload string if it exists
    const payload = JSON.stringify(
      postData === null || postData === void 0 ? void 0 : postData.text,
    )
    if (payload) {
      push(`payload = ${payload}`)
      blank()
    }
    // Create Headers
    const headers = allHeaders
    const headerCount = Object.keys(headers).length
    if (headerCount === 1) {
      for (const header in headers) {
        push(
          `headers = { '${header}': "${escapeForDoubleQuotes(headers[header])}" }`,
        )
        blank()
      }
    } else if (headerCount > 1) {
      let count = 1
      push('headers = {')
      for (const header in headers) {
        if (count++ !== headerCount) {
          push(`    '${header}': "${escapeForDoubleQuotes(headers[header])}",`)
        } else {
          push(`    '${header}': "${escapeForDoubleQuotes(headers[header])}"`)
        }
      }
      push('}')
      blank()
    }
    // Make Request
    if (payload && headerCount) {
      push(`conn.request("${method}", "${path}", payload, headers)`)
    } else if (payload && !headerCount) {
      push(`conn.request("${method}", "${path}", payload)`)
    } else if (!payload && headerCount) {
      push(`conn.request("${method}", "${path}", headers=headers)`)
    } else {
      push(`conn.request("${method}", "${path}")`)
    }
    // Get Response
    blank()
    push('res = conn.getresponse()')
    push('data = res.read()')
    blank()
    push('print(data.decode("utf-8"))')
    return join()
  },
}
