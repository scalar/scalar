// @ts-nocheck
/**
 * @description
 * HTTP code snippet generator for Node.js using Request.
 *
 * @author
 * @AhmadNassri
 *
 * for any questions or issues regarding the generated code snippet, please open an issue mentioning the author.
 */
import stringifyObject from 'stringify-object'

import { CodeBuilder } from '../../../helpers/code-builder.js'

export const request = {
  info: {
    key: 'request',
    title: 'Request',
    link: 'https://github.com/request/request',
    description: 'Simplified HTTP request client',
  },
  convert: (
    { method, url, queryObj, postData, headersObj, cookies },
    options,
  ) => {
    const opts = {
      indent: '  ',
      ...options,
    }
    let includeFS = false
    const { push, blank, join, unshift } = new CodeBuilder({
      indent: opts.indent,
    })
    push("const request = require('request');")
    blank()
    const reqOpts = {
      method,
      url,
    }
    if (Object.keys(queryObj).length) {
      reqOpts.qs = queryObj
    }
    if (Object.keys(headersObj).length) {
      reqOpts.headers = headersObj
    }
    switch (
      postData === null || postData === void 0 ? void 0 : postData.mimeType
    ) {
      case 'application/x-www-form-urlencoded':
        reqOpts.form = postData.paramsObj
        break
      case 'application/json':
        if (postData.jsonObj) {
          reqOpts.body = postData.jsonObj
          reqOpts.json = true
        }
        break
      case 'multipart/form-data':
        if (!postData.params) {
          break
        }
        reqOpts.formData = {}
        postData.params.forEach((param) => {
          if (!param.fileName && !param.fileName && !param.contentType) {
            reqOpts.formData[param.name] = param.value
            return
          }
          let attachment = {}
          if (param.fileName) {
            includeFS = true
            attachment = {
              value: `fs.createReadStream(${param.fileName})`,
              options: {
                filename: param.fileName,
                contentType: param.contentType ? param.contentType : null,
              },
            }
          } else if (param.value) {
            attachment.value = param.value
          }
          reqOpts.formData[param.name] = attachment
        })
        break
      default:
        if (postData === null || postData === void 0 ? void 0 : postData.text) {
          reqOpts.body = postData.text
        }
    }
    // construct cookies argument
    if (cookies.length) {
      reqOpts.jar = 'JAR'
      push('const jar = request.jar();')
      cookies.forEach((cookie) => {
        push(
          `jar.setCookie(request.cookie('${encodeURIComponent(cookie.name)}=${encodeURIComponent(cookie.value)}'), '${url}');`,
        )
      })
      blank()
    }
    if (includeFS) {
      unshift("const fs = require('fs');")
    }
    push(
      `const options = ${stringifyObject(reqOpts, { indent: '  ', inlineCharacterLimit: 80 })};`,
    )
    blank()
    push('request(options, function (error, response, body) {')
    push('if (error) throw new Error(error);', 1)
    blank()
    push('console.log(body);', 1)
    push('});')
    return join()
      .replace("'JAR'", 'jar')
      .replace(/'fs\.createReadStream\((.*)\)'/, "fs.createReadStream('$1')")
  },
}
