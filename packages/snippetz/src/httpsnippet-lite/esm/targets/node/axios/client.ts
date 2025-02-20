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
  convert: ({ method, url, queryObj, allHeaders, postData }, options) => {
    const opts = {
      indent: '  ',
      ...options,
    }
    const { blank, join, push, addPostProcessor } = new CodeBuilder({
      indent: opts.indent,
    })
    push("const axios = require('axios').default;")
    const reqOpts = {
      method,
      url,
    }
    if (Object.keys(queryObj).length) {
      reqOpts.params = queryObj
    }
    if (Object.keys(allHeaders).length) {
      reqOpts.headers = allHeaders
    }
    switch (
      postData === null || postData === void 0 ? void 0 : postData.mimeType
    ) {
      case 'application/x-www-form-urlencoded':
        if (postData.params) {
          push("const { URLSearchParams } = require('url');")
          blank()
          push('const encodedParams = new URLSearchParams();')
          postData.params.forEach((param) => {
            push(`encodedParams.set('${param.name}', '${param.value}');`)
          })
          blank()
          reqOpts.data = 'encodedParams,'
          addPostProcessor((code) =>
            code.replace(/'encodedParams,'/, 'encodedParams,'),
          )
        }
        break
      case 'application/json':
        blank()
        if (postData.jsonObj) {
          reqOpts.data = postData.jsonObj
        }
        break
      default:
        blank()
        if (postData === null || postData === void 0 ? void 0 : postData.text) {
          reqOpts.data = postData.text
        }
    }
    const stringifiedOptions = stringifyObject(reqOpts, {
      indent: '  ',
      inlineCharacterLimit: 80,
    })
    push(`const options = ${stringifiedOptions};`)
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
