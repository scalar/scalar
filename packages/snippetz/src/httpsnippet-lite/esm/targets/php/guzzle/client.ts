// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
/**
 * @description
 * HTTP code snippet generator for PHP using Guzzle.
 *
 * @author @RobertoArruda
 * @author @erunion
 *
 * for any questions or issues regarding the generated code snippet, please open an issue mentioning the author.
 */
import { CodeBuilder } from '../../../helpers/code-builder.js'
import { escapeForSingleQuotes } from '../../../helpers/escape.js'
import {
  getHeader,
  getHeaderName,
  hasHeader,
} from '../../../helpers/headers.js'
import { convertType } from '../helpers.js'

export const guzzle = {
  info: {
    key: 'guzzle',
    title: 'Guzzle',
    link: 'http://docs.guzzlephp.org/en/stable/',
    description: 'PHP with Guzzle',
  },
  convert: ({ postData, fullUrl, method, cookies, headersObj }, options) => {
    let _a
    const opts = {
      closingTag: false,
      indent: '  ',
      noTags: false,
      shortTags: false,
      ...options,
    }
    const { push, blank, join } = new CodeBuilder({ indent: opts.indent })
    const {
      code: requestCode,
      push: requestPush,
      join: requestJoin,
    } = new CodeBuilder({ indent: opts.indent })
    if (!opts.noTags) {
      push(opts.shortTags ? '<?' : '<?php')
      blank()
    }
    switch (
      postData === null || postData === void 0 ? void 0 : postData.mimeType
    ) {
      case 'application/x-www-form-urlencoded':
        requestPush(
          `'form_params' => ${convertType(postData.paramsObj, opts.indent + opts.indent, opts.indent)},`,
          1,
        )
        break
      case 'multipart/form-data': {
        const fields = []
        if (postData.params) {
          postData.params.forEach((param) => {
            if (param.fileName) {
              const field = {
                name: param.name,
                filename: param.fileName,
                contents: param.value,
              }
              if (param.contentType) {
                field.headers = { 'Content-Type': param.contentType }
              }
              fields.push(field)
            } else if (param.value) {
              fields.push({
                name: param.name,
                contents: param.value,
              })
            }
          })
        }
        if (fields.length) {
          requestPush(
            `'multipart' => ${convertType(fields, opts.indent + opts.indent, opts.indent)}`,
            1,
          )
          // Guzzle adds its own boundary for multipart requests.
          if (hasHeader(headersObj, 'content-type')) {
            if (
              (_a = getHeader(headersObj, 'content-type')) === null ||
              _a === void 0
                ? void 0
                : _a.indexOf('boundary')
            ) {
              const headerName = getHeaderName(headersObj, 'content-type')
              if (headerName) {
                delete headersObj[headerName]
              }
            }
          }
        }
        break
      }
      default:
        if (postData === null || postData === void 0 ? void 0 : postData.text) {
          requestPush(`'body' => ${convertType(postData.text)},`, 1)
        }
    }
    // construct headers
    const headers = Object.keys(headersObj)
      .sort()
      .map((key) => `${opts.indent}${opts.indent}'${key}' => '${escapeForSingleQuotes(headersObj[key])}',`)
    // construct cookies
    const cookieString = cookies
      .map(
        (cookie) =>
          `${encodeURIComponent(cookie.name)}=${encodeURIComponent(cookie.value)}`,
      )
      .join('; ')
    if (cookieString.length) {
      headers.push(
        `${opts.indent}${opts.indent}'cookie' => '${escapeForSingleQuotes(cookieString)}',`,
      )
    }
    if (headers.length) {
      requestPush("'headers' => [", 1)
      requestPush(headers.join('\n'))
      requestPush('],', 1)
    }
    push('$client = new \\GuzzleHttp\\Client();')
    blank()
    if (requestCode.length) {
      push(`$response = $client->request('${method}', '${fullUrl}', [`)
      push(requestJoin())
      push(']);')
    } else {
      push(`$response = $client->request('${method}', '${fullUrl}');`)
    }
    blank()
    push('echo $response->getBody();')
    if (!opts.noTags && opts.closingTag) {
      blank()
      push('?>')
    }
    return join()
  },
}
