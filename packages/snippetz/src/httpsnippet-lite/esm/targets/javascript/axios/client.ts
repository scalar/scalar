// @ts-nocheck
/**
 * @description
 * HTTP code snippet generator for Javascript & Node.js using Axios.
 *
 * @author
 * @rohit-gohri
 *
 * for any questions or issues regarding the generated code snippet, please open an issue mentioning the author.
 */
import stringifyObject from 'stringify-object'

import { CodeBuilder } from '../../../helpers/code-builder.js'

export const axios = {
  info: {
    key: 'axios',
    title: 'Axios',
    link: 'https://github.com/axios/axios',
    description: 'Promise based HTTP client for the browser and node.js',
  },
  convert: ({ allHeaders, method, url, queryObj, postData }, options) => {
    const opts = {
      indent: '  ',
      ...options,
    }
    const { blank, push, join, addPostProcessor } = new CodeBuilder({
      indent: opts.indent,
    })
    push("import axios from 'axios';")
    blank()
    const requestOptions = {
      method,
      url,
    }
    if (Object.keys(queryObj).length) {
      requestOptions.params = queryObj
    }
    if (Object.keys(allHeaders).length) {
      requestOptions.headers = allHeaders
    }
    switch (
      postData === null || postData === void 0 ? void 0 : postData.mimeType
    ) {
      case 'application/x-www-form-urlencoded':
        if (postData.params) {
          push('const encodedParams = new URLSearchParams();')
          postData.params.forEach((param) => {
            push(`encodedParams.set('${param.name}', '${param.value}');`)
          })
          blank()
          requestOptions.data = 'encodedParams,'
          addPostProcessor((code) =>
            code.replace(/'encodedParams,'/, 'encodedParams,'),
          )
        }
        break
      case 'application/json':
        if (postData.jsonObj) {
          requestOptions.data = postData.jsonObj
        }
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
        blank()
        requestOptions.data = '[form]'
        break
      default:
        if (postData === null || postData === void 0 ? void 0 : postData.text) {
          requestOptions.data = postData.text
        }
    }
    const optionString = stringifyObject(requestOptions, {
      indent: '  ',
      inlineCharacterLimit: 80,
    }).replace('"[form]"', 'form')
    push(`const options = ${optionString};`)
    blank()
    push('try {')
    push('const { data } = await axios.request(options);', 1)
    push('console.log(data);', 1)
    push('} catch (error) {')
    push('console.error(error);', 1)
    push('}')
    return join()
  },
}
