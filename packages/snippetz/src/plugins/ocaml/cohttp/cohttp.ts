import type { Plugin } from '@scalar/types/snippetz'

import { prepareRequest } from '@/libs/prepare-request'

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
    const { url, method, headers, body } = prepareRequest(request, configuration)
    const lines = [
      'open Lwt.Infix',
      '',
      'let () =',
      '  Lwt_main.run (',
      `    let uri = Uri.of_string ${quote(url)} in`,
      '    let headers = Cohttp.Header.of_list [',
      ...headers.map(({ name, value }) => `      (${quote(name)}, ${quote(value)});`),
      '    ] in',
    ]
    if (body) {
      for (const [index, segment] of body.entries()) {
        lines.push(
          'file' in segment
            ? `    Lwt_io.with_file ~mode:Lwt_io.Input ${quote(segment.file)} Lwt_io.read >>= fun part${index} ->`
            : `    let part${index} = ${quote(segment.text)} in`,
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
