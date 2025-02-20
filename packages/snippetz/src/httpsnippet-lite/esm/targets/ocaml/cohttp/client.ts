// @ts-nocheck
/**
 * @description
 * HTTP code snippet generator for OCaml using CoHTTP.
 *
 * @author
 * @SGrondin
 *
 * for any questions or issues regarding the generated code snippet, please open an issue mentioning the author.
 */
import { CodeBuilder } from '../../../helpers/code-builder.js'
import { escapeForDoubleQuotes } from '../../../helpers/escape.js'

export const cohttp = {
  info: {
    key: 'cohttp',
    title: 'CoHTTP',
    link: 'https://github.com/mirage/ocaml-cohttp',
    description:
      'Cohttp is a very lightweight HTTP server using Lwt or Async for OCaml',
  },
  convert: ({ fullUrl, allHeaders, postData, method }, options) => {
    const opts = {
      indent: '  ',
      ...options,
    }
    const methods = ['get', 'post', 'head', 'delete', 'patch', 'put', 'options']
    const { push, blank, join } = new CodeBuilder({ indent: opts.indent })
    push('open Cohttp_lwt_unix')
    push('open Cohttp')
    push('open Lwt')
    blank()
    push(`let uri = Uri.of_string "${fullUrl}" in`)
    // Add headers, including the cookies
    const headers = Object.keys(allHeaders)
    if (headers.length === 1) {
      push(
        `let headers = Header.add (Header.init ()) "${headers[0]}" "${escapeForDoubleQuotes(allHeaders[headers[0]])}" in`,
      )
    } else if (headers.length > 1) {
      push('let headers = Header.add_list (Header.init ()) [')
      headers.forEach((key) => {
        push(`("${key}", "${escapeForDoubleQuotes(allHeaders[key])}");`, 1)
      })
      push('] in')
    }
    // Add body
    if (postData === null || postData === void 0 ? void 0 : postData.text) {
      // Just text
      push(
        `let body = Cohttp_lwt_body.of_string ${JSON.stringify(postData.text)} in`,
      )
    }
    // Do the request
    blank()
    const h = headers.length ? '~headers ' : ''
    const b = (
      postData === null || postData === void 0 ? void 0 : postData.text
    )
      ? '~body '
      : ''
    const m = methods.includes(method.toLowerCase())
      ? `\`${method.toUpperCase()}`
      : `(Code.method_of_string "${method}")`
    push(`Client.call ${h}${b}${m} uri`)
    // Catch result
    push('>>= fun (res, body_stream) ->')
    push('(* Do stuff with the result *)', 1)
    return join()
  },
}
