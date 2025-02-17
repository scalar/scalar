// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
/**
 * @description
 * HTTP code snippet generator for Node.js using node-fetch.
 *
 * @author
 * @hirenoble
 *
 * for any questions or issues regarding the generated code snippet, please open an issue mentioning the author.
 */
import stringifyObject from 'stringify-object'

import { CodeBuilder } from '../../../helpers/code-builder.js'
import { getHeaderName } from '../../../helpers/headers.js'

export const fetch = {
  info: {
    key: 'fetch',
    title: 'Fetch',
    link: 'https://github.com/bitinn/node-fetch',
    description: 'Simplified HTTP node-fetch client',
  },
  convert: ({ method, fullUrl, postData, headersObj, cookies }, options) => {
    let _a
    const opts = {
      indent: '  ',
      ...options,
    }
    let includeFS = false
    const { blank, push, join, unshift } = new CodeBuilder({
      indent: opts.indent,
    })
    push("const fetch = require('node-fetch');")
    blank()
    const reqOpts = {
      method,
    }
    if (Object.keys(headersObj).length) {
      reqOpts.headers = headersObj
    }
    switch (
      postData === null || postData === void 0 ? void 0 : postData.mimeType
    ) {
      case 'application/x-www-form-urlencoded':
        unshift("const { URLSearchParams } = require('url');")
        push('const encodedParams = new URLSearchParams();')
        ;(_a = postData.params) === null || _a === void 0
          ? void 0
          : _a.forEach((param) => {
              push(`encodedParams.set('${param.name}', '${param.value}');`)
            })
        blank()
        reqOpts.body = 'encodedParams'
        break
      case 'application/json':
        if (postData.jsonObj) {
          reqOpts.body = JSON.stringify(postData.jsonObj)
        }
        break
      case 'multipart/form-data': {
        if (!postData.params) {
          break
        }
        // The `form-data` module automatically adds a `Content-Type` header for `multipart/form-data` content and if we add our own here data won't be correctly transmitted.
        // eslint-disable-next-line no-case-declarations -- We're only using `contentTypeHeader` within this block.
        const contentTypeHeader = getHeaderName(headersObj, 'content-type')
        if (contentTypeHeader) {
          delete headersObj[contentTypeHeader]
        }
        unshift("const FormData = require('form-data');")
        push('const formData = new FormData();')
        postData.params.forEach((param) => {
          if (!param.fileName && !param.fileName && !param.contentType) {
            push(`formData.append('${param.name}', '${param.value}');`)
            return
          }
          if (param.fileName) {
            includeFS = true
            push(
              `formData.append('${param.name}', fs.createReadStream('${param.fileName}'));`,
            )
          }
        })
        blank()
        break
      }
      default:
        if (postData === null || postData === void 0 ? void 0 : postData.text) {
          reqOpts.body = postData.text
        }
    }
    // construct cookies argument
    if (cookies.length) {
      const cookiesString = cookies
        .map(
          (cookie) =>
            `${encodeURIComponent(cookie.name)}=${encodeURIComponent(cookie.value)}`,
        )
        .join('; ')
      if (reqOpts.headers) {
        reqOpts.headers.cookie = cookiesString
      } else {
        reqOpts.headers = {}
        reqOpts.headers.cookie = cookiesString
      }
    }
    push(`const url = '${fullUrl}';`)
    // If we ultimately don't have any headers to send then we shouldn't add an empty object into the request options.
    if (reqOpts.headers && !Object.keys(reqOpts.headers).length) {
      delete reqOpts.headers
    }
    const stringifiedOptions = stringifyObject(reqOpts, {
      indent: '  ',
      inlineCharacterLimit: 80,
    })
    push(`const options = ${stringifiedOptions};`)
    if (includeFS) {
      unshift("const fs = require('fs');")
    }
    if (
      (postData === null || postData === void 0 ? void 0 : postData.params) &&
      postData.mimeType === 'multipart/form-data'
    ) {
      push('options.body = formData;')
    }
    blank()
    push('try {')
    push('const response = await fetch(url, options);', 1)
    push('const data = await response.json();', 1)
    push('console.log(data);', 1)
    push('} catch (error) {')
    push('console.error(error);', 1)
    push('}')
    return join()
      .replace(/'encodedParams'/, 'encodedParams')
      .replace(
        /"fs\.createReadStream\(\\"(.+)\\"\)"/,
        'fs.createReadStream("$1")',
      )
  },
}
