// @ts-nocheck
/**
 * @description
 * HTTP code snippet generator for Node.js using Unirest.
 *
 * @author
 * @AhmadNassri
 *
 * for any questions or issues regarding the generated code snippet, please open an issue mentioning the author.
 */
import stringifyObject from 'stringify-object'

import { CodeBuilder } from '../../../helpers/code-builder.js'

export const unirest = {
  info: {
    key: 'unirest',
    title: 'Unirest',
    link: 'http://unirest.io/nodejs.html',
    description: 'Lightweight HTTP Request Client Library',
  },
  convert: (
    { method, url, cookies, queryObj, postData, headersObj },
    options,
  ) => {
    const opts = {
      indent: '  ',
      ...options,
    }
    let includeFS = false
    const { addPostProcessor, blank, join, push, unshift } = new CodeBuilder({
      indent: opts.indent,
    })
    push("const unirest = require('unirest');")
    blank()
    push(`const req = unirest('${method}', '${url}');`)
    blank()
    if (cookies.length) {
      push('const CookieJar = unirest.jar();')
      cookies.forEach((cookie) => {
        push(
          `CookieJar.add('${encodeURIComponent(cookie.name)}=${encodeURIComponent(cookie.value)}', '${url}');`,
        )
      })
      push('req.jar(CookieJar);')
      blank()
    }
    if (Object.keys(queryObj).length) {
      push(`req.query(${stringifyObject(queryObj, { indent: opts.indent })});`)
      blank()
    }
    if (Object.keys(headersObj).length) {
      push(
        `req.headers(${stringifyObject(headersObj, { indent: opts.indent })});`,
      )
      blank()
    }
    switch (
      postData === null || postData === void 0 ? void 0 : postData.mimeType
    ) {
      case 'application/x-www-form-urlencoded':
        if (postData.paramsObj) {
          push(
            `req.form(${stringifyObject(postData.paramsObj, { indent: opts.indent })});`,
          )
          blank()
        }
        break
      case 'application/json':
        if (postData.jsonObj) {
          push("req.type('json');")
          push(
            `req.send(${stringifyObject(postData.jsonObj, { indent: opts.indent })});`,
          )
          blank()
        }
        break
      case 'multipart/form-data': {
        if (!postData.params) {
          break
        }
        const multipart = []
        postData.params.forEach((param) => {
          const part = {}
          if (param.fileName && !param.value) {
            includeFS = true
            part.body = `fs.createReadStream('${param.fileName}')`
            addPostProcessor((code) =>
              code.replace(
                /'fs\.createReadStream\(\\'(.+)\\'\)'/,
                "fs.createReadStream('$1')",
              ),
            )
          } else if (param.value) {
            part.body = param.value
          }
          if (part.body) {
            if (param.contentType) {
              part['content-type'] = param.contentType
            }
            multipart.push(part)
          }
        })
        push(
          `req.multipart(${stringifyObject(multipart, { indent: opts.indent })});`,
        )
        blank()
        break
      }
      default:
        if (postData === null || postData === void 0 ? void 0 : postData.text) {
          push(
            `req.send(${stringifyObject(postData.text, { indent: opts.indent })});`,
          )
          blank()
        }
    }
    if (includeFS) {
      unshift("const fs = require('fs');")
    }
    push('req.end(function (res) {')
    push('if (res.error) throw new Error(res.error);', 1)
    blank()
    push('console.log(res.body);', 1)
    push('});')
    return join()
  },
}
