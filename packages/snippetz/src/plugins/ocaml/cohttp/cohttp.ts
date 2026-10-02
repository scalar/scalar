import type { Plugin } from '@scalar/types/snippetz'

import { multipartFileBoundary, prepareRequest } from '@/libs/prepare-request'

/** OCaml uses three-digit decimal escapes for control bytes. */
const quote = (value: string): string =>
  `"${Array.from(value, (character) => {
    if (character === '\\' || character === '"') {
      return `\\${character}`
    }
    const code = character.charCodeAt(0)
    return code < 32 || code === 127 ? `\\${code.toString().padStart(3, '0')}` : character
  }).join('')}"`

/** Generates a complete Lwt request, preserving binary file contents in multipart bodies. */
export const ocamlCohttp: Plugin = {
  target: 'ocaml',
  client: 'cohttp',
  title: 'Cohttp',
  generate(request, configuration) {
    const prepared = prepareRequest(request, configuration)
    const { url, method, headers, body } = prepared
    const boundary = multipartFileBoundary(prepared)
    const literal = (value: string): string =>
      boundary ? `(${value.split(boundary).map(quote).join(' ^ boundary ^ ')})` : quote(value)
    const lines = [
      'open Lwt.Infix',
      '',
      'let () =',
      ...(boundary ? ['  Random.self_init ();'] : []),
      '  Lwt_main.run (',
      ...(boundary
        ? [
            '    let boundary = Printf.sprintf "%08x%08x%08x%08x" (Random.bits ()) (Random.bits ()) (Random.bits ()) (Random.bits ()) in',
          ]
        : []),
      `    let uri = Uri.of_string ${quote(url)} in`,
      '    let headers = Cohttp.Header.of_list [',
      ...headers.map(
        ({ name, value }) =>
          `      (${quote(name)}, ${name.toLowerCase() === 'content-type' ? literal(value) : quote(value)});`,
      ),
      '    ] in',
    ]
    if (body) {
      for (const [index, segment] of body.entries()) {
        lines.push(
          'file' in segment
            ? `    Lwt_io.with_file ~mode:Lwt_io.Input ${quote(segment.file)} Lwt_io.read >>= fun part${index} ->`
            : `    let part${index} = ${literal(segment.text)} in`,
        )
      }
      lines.push(
        `    let body = Cohttp_lwt.Body.of_string (String.concat "" [${body.map((_, index) => `part${index}`).join('; ')}]) in`,
      )
    }
    lines.push(
      `    Cohttp_lwt_unix.Client.call ~headers ${body ? '~body ' : ''}(Cohttp.Code.method_of_string ${quote(method)}) uri`,
      '    >>= fun (_response, body) ->',
      '    Cohttp_lwt.Body.to_string body >>= Lwt_io.printl',
      '  )',
    )
    return lines.join('\n')
  },
}
