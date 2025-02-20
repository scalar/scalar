// @ts-nocheck
/**
 * @description
 * HTTP code snippet generator for native XMLHttpRequest
 *
 * @author
 * @AhmadNassri
 *
 * for any questions or issues regarding the generated code snippet, please open an issue mentioning the author.
 */
import stringifyObject from 'stringify-object'

import { CodeBuilder } from '../../../helpers/code-builder.js'
import {
  getHeader,
  getHeaderName,
  hasHeader,
} from '../../../helpers/headers.js'

export const jquery = {
  info: {
    key: 'jquery',
    title: 'jQuery',
    link: 'http://api.jquery.com/jquery.ajax/',
    description: 'Perform an asynchronous HTTP (Ajax) requests with jQuery',
  },
  convert: ({ fullUrl, method, allHeaders, postData }, options) => {
    let _a
    const opts = {
      indent: '  ',
      ...options,
    }
    const { blank, push, join } = new CodeBuilder({ indent: opts.indent })
    const settings = {
      async: true,
      crossDomain: true,
      url: fullUrl,
      method,
      headers: allHeaders,
    }
    switch (
      postData === null || postData === void 0 ? void 0 : postData.mimeType
    ) {
      case 'application/x-www-form-urlencoded':
        settings.data = postData.paramsObj ? postData.paramsObj : postData.text
        break
      case 'application/json':
        settings.processData = false
        settings.data = postData.text
        break
      case 'multipart/form-data':
        if (!postData.params) {
          break
        }
        push('const form = new FormData();')
        postData.params.forEach((param) => {
          push(
            `form.append('${param.name}', '${param.value || param.fileName || ''}');`,
          )
        })
        settings.processData = false
        settings.contentType = false
        settings.mimeType = 'multipart/form-data'
        settings.data = '[form]'
        // remove the contentType header
        if (hasHeader(allHeaders, 'content-type')) {
          if (
            (_a = getHeader(allHeaders, 'content-type')) === null ||
            _a === void 0
              ? void 0
              : _a.includes('boundary')
          ) {
            const headerName = getHeaderName(allHeaders, 'content-type')
            if (headerName) {
              delete settings.headers[headerName]
            }
          }
        }
        blank()
        break
      default:
        if (postData === null || postData === void 0 ? void 0 : postData.text) {
          settings.data = postData.text
        }
    }
    const stringifiedSettings = stringifyObject(settings, {
      indent: opts.indent,
    }).replace("'[form]'", 'form')
    push(`const settings = ${stringifiedSettings};`)
    blank()
    push('$.ajax(settings).done(function (response) {')
    push('console.log(response);', 1)
    push('});')
    return join()
  },
}
