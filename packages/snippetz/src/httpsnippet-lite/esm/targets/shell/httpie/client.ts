// @ts-nocheck
/**
 * @description
 * HTTP code snippet generator for the Shell using HTTPie.
 *
 * @author
 * @AhmadNassri
 *
 * for any questions or issues regarding the generated code snippet, please open an issue mentioning the author.
 */
import { CodeBuilder } from '../../../helpers/code-builder.js'
import { quote } from '../../../helpers/shell.js'

export const httpie = {
  info: {
    key: 'httpie',
    title: 'HTTPie',
    link: 'http://httpie.org/',
    description: 'a CLI, cURL-like tool for humans',
  },
  convert: (
    { allHeaders, postData, queryObj, fullUrl, method, url },
    options,
  ) => {
    const opts = {
      body: false,
      cert: false,
      headers: false,
      indent: '  ',
      pretty: false,
      print: false,
      queryParams: false,
      short: false,
      style: false,
      timeout: false,
      verbose: false,
      verify: false,
      ...options,
    }
    const { push, join, unshift } = new CodeBuilder({
      indent: opts.indent,
      // @ts-expect-error SEEMS LEGIT
      join: opts.indent !== false ? ` \\\n${opts.indent}` : ' ',
    })
    let raw = false
    const flags = []
    if (opts.headers) {
      flags.push(opts.short ? '-h' : '--headers')
    }
    if (opts.body) {
      flags.push(opts.short ? '-b' : '--body')
    }
    if (opts.verbose) {
      flags.push(opts.short ? '-v' : '--verbose')
    }
    if (opts.print) {
      flags.push(`${opts.short ? '-p' : '--print'}=${opts.print}`)
    }
    if (opts.verify) {
      flags.push(`--verify=${opts.verify}`)
    }
    if (opts.cert) {
      flags.push(`--cert=${opts.cert}`)
    }
    if (opts.pretty) {
      flags.push(`--pretty=${opts.pretty}`)
    }
    if (opts.style) {
      flags.push(`--style=${opts.style}`)
    }
    if (opts.timeout) {
      flags.push(`--timeout=${opts.timeout}`)
    }
    // construct query params
    if (opts.queryParams) {
      Object.keys(queryObj).forEach((name) => {
        const value = queryObj[name]
        if (Array.isArray(value)) {
          value.forEach((val) => {
            push(`${name}==${quote(val)}`)
          })
        } else {
          push(`${name}==${quote(value)}`)
        }
      })
    }
    // construct headers
    Object.keys(allHeaders)
      .sort()
      .forEach((key) => {
        push(`${key}:${quote(allHeaders[key])}`)
      })
    if (
      (postData === null || postData === void 0
        ? void 0
        : postData.mimeType) === 'application/x-www-form-urlencoded'
    ) {
      // construct post params
      if (postData.params?.length) {
        flags.push(opts.short ? '-f' : '--form')
        postData.params.forEach((param) => {
          push(`${param.name}=${quote(param.value)}`)
        })
      }
    } else if (
      (postData === null || postData === void 0
        ? void 0
        : postData.mimeType) === 'multipart/form-data'
    ) {
      // construct multipart form data
      if (postData.params?.length) {
        flags.push('--multipart')
        postData.params.forEach((param) => {
          if (param.fileName) {
            push(`${param.name}@${quote(param.fileName)}`)
          } else {
            push(`${param.name}='${quote(param.value)}'`)
          }
        })
      }
    } else {
      raw = true
    }
    const cliFlags = flags.length ? `${flags.join(' ')} ` : ''
    url = quote(opts.queryParams ? url : fullUrl)
    unshift(`http ${cliFlags}${method} ${url}`)
    if (
      raw &&
      (postData === null || postData === void 0 ? void 0 : postData.text)
    ) {
      const postDataText = quote(postData.text)
      unshift(`echo ${postDataText} | `)
    }
    return join()
  },
}
