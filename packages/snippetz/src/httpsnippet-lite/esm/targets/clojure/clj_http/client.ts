// @ts-nocheck
/**
 * @description
 * HTTP code snippet generator for Clojure using clj-http.
 *
 * @author
 * @tggreene
 *
 * for any questions or issues regarding the generated code snippet, please open an issue mentioning the author.
 */
import { CodeBuilder } from '../../../helpers/code-builder.js'
import { getHeader, getHeaderName } from '../../../helpers/headers.js'

class Keyword {
  constructor(name) {
    this.name = ''
    this.toString = () => `:${this.name}`
    this.name = name
  }
}
class File {
  constructor(path) {
    this.path = ''
    this.toString = () => `(clojure.java.io/file "${this.path}")`
    this.path = path
  }
}
const jsType = (input) => {
  if (input === undefined) {
    return null
  }
  if (input === null) {
    return 'null'
  }
  return input.constructor.name.toLowerCase()
}
const objEmpty = (input) => {
  if (jsType(input) === 'object') {
    return Object.keys(input).length === 0
  }
  return false
}
const filterEmpty = (input) => {
  Object.keys(input)
    .filter((x) => objEmpty(input[x]))
    .forEach((x) => {
      delete input[x]
    })
  return input
}
const padBlock = (padSize, input) => {
  const padding = ' '.repeat(padSize)
  return input.replace(/\n/g, `\n${padding}`)
}
const jsToEdn = (js) => {
  switch (jsType(js)) {
    case 'string':
      return `"${js.replace(/"/g, '\\"')}"`
    case 'file':
      return js.toString()
    case 'keyword':
      return js.toString()
    case 'null':
      return 'nil'
    case 'regexp':
      return `#"${js.source}"`
    case 'object': {
      // simple vertical format
      const obj = Object.keys(js)
        .reduce((accumulator, key) => {
          const val = padBlock(key.length + 2, jsToEdn(js[key]))
          return `${accumulator}:${key} ${val}\n `
        }, '')
        .trim()
      return `{${padBlock(1, obj)}}`
    }
    case 'array': {
      // simple horizontal format
      const arr = js
        .reduce((accumulator, value) => `${accumulator} ${jsToEdn(value)}`, '')
        .trim()
      return `[${padBlock(1, arr)}]`
    }
    default: // 'number' 'boolean'
      return js.toString()
  }
}
export const clj_http = {
  info: {
    key: 'clj_http',
    title: 'clj-http',
    link: 'https://github.com/dakrone/clj-http',
    description: 'An idiomatic clojure http client wrapping the apache client.',
  },
  convert: ({ queryObj, method, postData, url, allHeaders }, options) => {
    const { push, join } = new CodeBuilder({
      indent: options === null || options === void 0 ? void 0 : options.indent,
    })
    const methods = ['get', 'post', 'put', 'delete', 'patch', 'head', 'options']
    method = method.toLowerCase()
    if (!methods.includes(method)) {
      push('Method not supported')
      return join()
    }
    const params = {
      'headers': allHeaders,
      'query-params': queryObj,
    }

    // Remove query string from URL if queryObj has parameters
    if (queryObj && Object.keys(queryObj).length > 0) {
      url = url.split('?')[0]
    }

    switch (
      postData === null || postData === void 0 ? void 0 : postData.mimeType
    ) {
      case 'application/json':
        {
          params['content-type'] = new Keyword('json')
          params['form-params'] = postData.jsonObj
          const header = getHeaderName(params.headers, 'content-type')
          if (header) {
            delete params.headers[header]
          }
        }
        break
      case 'application/x-www-form-urlencoded':
        {
          params['form-params'] = postData.paramsObj
          const header = getHeaderName(params.headers, 'content-type')
          if (header) {
            delete params.headers[header]
          }
        }
        break
      case 'text/plain':
        {
          params.body = postData.text
          const header = getHeaderName(params.headers, 'content-type')
          if (header) {
            delete params.headers[header]
          }
        }
        break
      case 'multipart/form-data': {
        if (postData.params) {
          params.multipart = postData.params.map((param) => {
            if (param.fileName && !param.value) {
              return {
                name: param.name,
                content: new File(param.fileName),
              }
            }
            return {
              name: param.name,
              content: param.value,
            }
          })
          const header = getHeaderName(params.headers, 'content-type')
          if (header) {
            delete params.headers[header]
          }
        }
        break
      }
    }
    switch (getHeader(params.headers, 'accept')) {
      case 'application/json':
        {
          params.accept = new Keyword('json')
          const header = getHeaderName(params.headers, 'accept')
          if (header) {
            delete params.headers[header]
          }
        }
        break
    }
    push("(require '[clj-http.client :as client])\n")
    if (objEmpty(filterEmpty(params))) {
      push(`(client/${method} "${url}")`)
    } else {
      const padding = 11 + method.length + url.length
      const formattedParams = padBlock(padding, jsToEdn(filterEmpty(params)))
      push(`(client/${method} "${url}" ${formattedParams})`)
    }
    return join()
  },
}
