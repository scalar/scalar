// @ts-nocheck
/**
 * @description
 * HTTP code snippet generator for native Node.js.
 *
 * @author
 * @AhmadNassri
 *
 * for any questions or issues regarding the generated code snippet, please open an issue mentioning the author.
 */
import stringifyObject from 'stringify-object'

import { CodeBuilder } from '../../../helpers/code-builder.js'

export const native = {
  info: {
    key: 'native',
    title: 'HTTP',
    link: 'http://nodejs.org/api/http.html#http_http_request_options_callback',
    description: 'Node.js native HTTP interface',
  },
  convert: ({ uriObj, method, allHeaders, postData }, options = {}) => {
    const { indent = '  ', insecureSkipVerify = false } = options
    const { blank, join, push, unshift } = new CodeBuilder({ indent })
    const reqOpts = {
      method,
      hostname: uriObj.hostname,
      port: uriObj.port === '' ? null : uriObj.port,
      path: uriObj.path,
      headers: allHeaders,
      ...(insecureSkipVerify ? { rejectUnauthorized: false } : {}),
    }
    push(`const http = require('${uriObj.protocol.replace(':', '')}');`)
    blank()
    push(`const options = ${stringifyObject(reqOpts, { indent })};`)
    blank()
    push('const req = http.request(options, function (res) {')
    push('const chunks = [];', 1)
    blank()
    push("res.on('data', function (chunk) {", 1)
    push('chunks.push(chunk);', 2)
    push('});', 1)
    blank()
    push("res.on('end', function () {", 1)
    push('const body = Buffer.concat(chunks);', 2)
    push('console.log(body.toString());', 2)
    push('});', 1)
    push('});')
    blank()
    switch (
      postData === null || postData === void 0 ? void 0 : postData.mimeType
    ) {
      case 'application/x-www-form-urlencoded':
        if (postData.paramsObj) {
          unshift("const qs = require('querystring');")
          push(
            `req.write(qs.stringify(${stringifyObject(postData.paramsObj, {
              indent: '  ',
              inlineCharacterLimit: 80,
            })}));`,
          )
        }
        break
      case 'application/json':
        if (postData.jsonObj) {
          push(
            `req.write(JSON.stringify(${stringifyObject(postData.jsonObj, {
              indent: '  ',
              inlineCharacterLimit: 80,
            })}));`,
          )
        }
        break
      default:
        if (postData === null || postData === void 0 ? void 0 : postData.text) {
          push(`req.write(${stringifyObject(postData.text, { indent })});`)
        }
    }
    push('req.end();')
    return join()
  },
}
