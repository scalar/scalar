// @ts-nocheck
/**
 * @description
 * HTTP code snippet generator for fetch
 *
 * @author
 * @pmdroid
 *
 * for any questions or issues regarding the generated code snippet, please open an issue mentioning the author.
 */
import stringifyObject from 'stringify-object'

import { CodeBuilder } from '../../../helpers/code-builder.js'
import { getHeaderName } from '../../../helpers/headers.js'

export const fetch = {
  info: {
    key: 'fetch',
    title: 'fetch',
    link: 'https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch',
    description: 'Perform asynchronous HTTP requests with the Fetch API',
  },
  convert: ({ method, allHeaders, postData, fullUrl }, inputOpts) => {
    const opts = {
      indent: '  ',
      credentials: null,
      ...inputOpts,
    }
    const { blank, join, push } = new CodeBuilder({ indent: opts.indent })
    const options = {
      method,
    }
    if (Object.keys(allHeaders).length) {
      options.headers = allHeaders
    }
    if (opts.credentials !== null) {
      options.credentials = opts.credentials
    }
    push(`const url = '${fullUrl}';`)
    switch (
      postData === null || postData === void 0 ? void 0 : postData.mimeType
    ) {
      case 'application/x-www-form-urlencoded':
        options.body = postData.paramsObj ? postData.paramsObj : postData.text
        break
      case 'application/json':
        options.body = JSON.stringify(postData.jsonObj)
        break
      case 'multipart/form-data': {
        if (!postData.params) {
          break
        }
        // The FormData API automatically adds a `Content-Type` header for `multipart/form-data` content and if we add our own here data won't be correctly transmitted.
        const contentTypeHeader = getHeaderName(allHeaders, 'content-type')
        if (contentTypeHeader) {
          delete allHeaders[contentTypeHeader]
        }
        push('const form = new FormData();')
        postData.params.forEach((param) => {
          push(
            `form.append('${param.name}', '${param.value || param.fileName || ''}');`,
          )
        })
        blank()
        break
      }
      default:
        if (postData === null || postData === void 0 ? void 0 : postData.text) {
          options.body = postData.text
        }
    }
    // If we ultimately don't have any headers to send then we shouldn't add an empty object into the request options.
    if (options.headers && !Object.keys(options.headers).length) {
      delete options.headers
    }
    push(
      `const options = ${stringifyObject(options, {
        indent: opts.indent,
        inlineCharacterLimit: 80,
        transform: (_, property, originalResult) => {
          if (
            property === 'body' &&
            postData &&
            postData.mimeType === 'application/x-www-form-urlencoded'
          ) {
            return `new URLSearchParams(${originalResult})`
          }
          return originalResult
        },
      })};`,
    )
    blank()
    if (
      (postData === null || postData === void 0 ? void 0 : postData.params) &&
      postData.mimeType === 'multipart/form-data'
    ) {
      push('options.body = form;')
      blank()
    }
    push('try {')
    push('const response = await fetch(url, options);', 1)
    push('const data = await response.json();', 1)
    push('console.log(data);', 1)
    push('} catch (error) {')
    push('console.error(error);', 1)
    push('}')
    return join()
  },
}
