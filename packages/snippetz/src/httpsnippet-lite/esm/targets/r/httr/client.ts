// @ts-nocheck
/**
 * @description
 * HTTP code snippet generator for R using httr
 *
 * @author
 * @gabrielakoreeda
 *
 * for any questions or issues regarding the generated code snippet, please open an issue mentioning the author.
 */
import { CodeBuilder } from '../../../helpers/code-builder.js'
import {
  escapeForDoubleQuotes,
  escapeForSingleQuotes,
} from '../../../helpers/escape.js'
import { getHeader } from '../../../helpers/headers.js'

export const httr = {
  info: {
    key: 'httr',
    title: 'httr',
    link: 'https://cran.r-project.org/web/packages/httr/vignettes/quickstart.html',
    description: 'httr: Tools for Working with URLs and HTTP',
  },
  convert: (
    { url, queryObj, queryString, postData, allHeaders, method },
    options = {},
  ) => {
    let _a, _b
    // Start snippet
    const { push, blank, join } = new CodeBuilder({
      indent: (_a = options.indent) !== null && _a !== void 0 ? _a : '  ',
    })
    // Import httr
    push('library(httr)')
    blank()
    // Set URL
    push(`url <- "${url}"`)
    blank()
    // Construct query string
    const qs = queryObj
    delete queryObj.key
    const entries = Object.entries(qs)
    const entriesCount = entries.length
    if (entriesCount === 1) {
      const entry = entries[0]
      push(`queryString <- list(${entry[0]} = "${entry[1]}")`)
      blank()
    } else if (entriesCount > 1) {
      push('queryString <- list(')
      entries.forEach(([key, value], i) => {
        const isLastItem = i !== entriesCount - 1
        const maybeComma = isLastItem ? ',' : ''
        push(`${key} = "${value}"${maybeComma}`, 1)
      })
      push(')')
      blank()
    }
    // Construct payload
    const payload = JSON.stringify(
      postData === null || postData === void 0 ? void 0 : postData.text,
    )
    if (payload) {
      push(`payload <- ${payload}`)
      blank()
    }
    // Define encode
    if (postData && (postData.text || postData.jsonObj || postData.params)) {
      switch (postData.mimeType) {
        case 'application/x-www-form-urlencoded':
          push('encode <- "form"')
          blank()
          break
        case 'application/json':
          push('encode <- "json"')
          blank()
          break
        case 'multipart/form-data':
          push('encode <- "multipart"')
          blank()
          break
        default:
          push('encode <- "raw"')
          blank()
          break
      }
    }
    // Construct headers
    const cookieHeader = getHeader(allHeaders, 'cookie')
    const acceptHeader = getHeader(allHeaders, 'accept')
    const setCookies = cookieHeader
      ? `set_cookies(\`${String(cookieHeader)
          .replace(/;/g, '", `')
          .replace(/` /g, '`')
          .replace(/[=]/g, '` = "')}")`
      : undefined
    const setAccept = acceptHeader
      ? `accept("${escapeForDoubleQuotes(acceptHeader)}")`
      : undefined
    const setContentType = `content_type("${escapeForDoubleQuotes((_b = postData === null || postData === void 0 ? void 0 : postData.mimeType) !== null && _b !== void 0 ? _b : 'application/octet-stream')}")`
    const otherHeaders = Object.entries(allHeaders)
      // These headers are all handled separately:
      .filter(
        ([key]) =>
          !['cookie', 'accept', 'content-type'].includes(key.toLowerCase()),
      )
      .map(([key, value]) => `'${key}' = '${escapeForSingleQuotes(value)}'`)
      .join(', ')
    const setHeaders = otherHeaders ? `add_headers(${otherHeaders})` : undefined
    // Construct request
    let request = `response <- VERB("${method}", url`
    if (payload) {
      request += ', body = payload'
    }
    if (queryString.length) {
      request += ', query = queryString'
    }
    const headerAdditions = [setHeaders, setContentType, setAccept, setCookies]
      .filter((x) => !!x)
      .join(', ')
    if (headerAdditions) {
      request += `, ${headerAdditions}`
    }
    if (postData && (postData.text || postData.jsonObj || postData.params)) {
      request += ', encode = encode'
    }
    request += ')'
    push(request)
    blank()
    // Print response
    push('content(response, "text")')
    return join()
  },
}
