// @ts-nocheck
/**
 * @description
 * HTTP code snippet generator for PHP using curl-ext.
 *
 * @author
 * @AhmadNassri
 *
 * for any questions or issues regarding the generated code snippet, please open an issue mentioning the author.
 */
import { CodeBuilder } from '../../../helpers/code-builder.js'
import {
  getHeader,
  getHeaderName,
  hasHeader,
} from '../../../helpers/headers.js'
import { convertType } from '../helpers.js'

export const http2 = {
  info: {
    key: 'http2',
    title: 'HTTP v2',
    link: 'http://devel-m6w6.rhcloud.com/mdref/http',
    description: 'PHP with pecl/http v2',
  },
  convert: (
    { postData, headersObj, method, queryObj, cookiesObj, url },
    options = {},
  ) => {
    let _a
    const {
      closingTag = false,
      indent = '  ',
      noTags = false,
      shortTags = false,
    } = options
    const { push, blank, join } = new CodeBuilder({ indent })
    let hasBody = false
    if (!noTags) {
      push(shortTags ? '<?' : '<?php')
      blank()
    }
    push('$client = new http\\Client;')
    push('$request = new http\\Client\\Request;')
    blank()
    switch (
      postData === null || postData === void 0 ? void 0 : postData.mimeType
    ) {
      case 'application/x-www-form-urlencoded':
        push('$body = new http\\Message\\Body;')
        push(
          `$body->append(new http\\QueryString(${convertType(postData.paramsObj, indent)}));`,
        )
        blank()
        hasBody = true
        break
      case 'multipart/form-data': {
        if (!postData.params) {
          break
        }
        const files = []
        const fields = {}
        postData.params.forEach(({ name, fileName, value, contentType }) => {
          if (fileName) {
            files.push({
              name,
              type: contentType,
              file: fileName,
              data: value,
            })
            return
          }
          if (value) {
            fields[name] = value
          }
        })
        const field = Object.keys(fields).length
          ? convertType(fields, indent)
          : 'null'
        const formValue = files.length ? convertType(files, indent) : 'null'
        push('$body = new http\\Message\\Body;')
        push(`$body->addForm(${field}, ${formValue});`)
        // remove the contentType header
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
        blank()
        hasBody = true
        break
      }
      case 'application/json':
        push('$body = new http\\Message\\Body;')
        push(
          `$body->append(json_encode(${convertType(postData.jsonObj, indent)}));`,
        )
        hasBody = true
        break
      default:
        if (postData === null || postData === void 0 ? void 0 : postData.text) {
          push('$body = new http\\Message\\Body;')
          push(`$body->append(${convertType(postData.text)});`)
          blank()
          hasBody = true
        }
    }
    push(`$request->setRequestUrl(${convertType(url)});`)
    push(`$request->setRequestMethod(${convertType(method)});`)
    if (hasBody) {
      push('$request->setBody($body);')
      blank()
    }
    if (Object.keys(queryObj).length) {
      push(
        `$request->setQuery(new http\\QueryString(${convertType(queryObj, indent)}));`,
      )
      blank()
    }
    if (Object.keys(headersObj).length) {
      push(`$request->setHeaders(${convertType(headersObj, indent)});`)
      blank()
    }
    if (Object.keys(cookiesObj).length) {
      blank()
      push(`$client->setCookies(${convertType(cookiesObj, indent)});`)
      blank()
    }
    push('$client->enqueue($request)->send();')
    push('$response = $client->getResponse();')
    blank()
    push('echo $response->getBody();')
    if (!noTags && closingTag) {
      blank()
      push('?>')
    }
    return join()
  },
}
