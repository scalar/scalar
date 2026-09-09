import type { Plugin } from '@scalar/types/snippetz'

import { prepareRequest } from '@/libs/prepare-request'
import { escapeSingleQuotes } from '@/libs/shell'

const quote = (value: string): string => `'${escapeSingleQuotes(value)}'`

/** Generates an HTTPie command, streaming multipart files without shell interpolation. */
export const shellHttpie: Plugin = {
  target: 'shell',
  client: 'httpie',
  title: 'HTTPie',
  generate(request, configuration) {
    const { url, method, headers, body } = prepareRequest(request, configuration)
    const rawBody =
      body?.length === 1 && body[0] && 'text' in body[0] && !body[0].text.includes('\0') ? body[0].text : undefined
    const parts = [`http${!body || rawBody !== undefined ? ' --ignore-stdin' : ''} ${quote(method)} ${quote(url)}`]
    for (const { name, value } of headers) {
      // HTTPie uses a semicolon for an explicitly empty header; a colon unsets it.
      const escapedName = name.replaceAll('\\', '\\\\').replaceAll(':', '\\:').replaceAll(';', '\\;')
      parts.push(quote(value ? `${escapedName}:${value}` : `${escapedName};`))
    }
    const command = parts.join(' \\\n  ')
    if (!body) {
      return command
    }
    if (rawBody !== undefined) {
      return `${command} \\\n  --raw ${quote(rawBody)}`
    }
    const input = body.map((segment) => {
      if ('file' in segment) {
        return `  cat -- ${quote(segment.file)}`
      }
      const text = Array.from(segment.text, (character) => {
        if (character === '\\') {
          return '\\\\'
        }
        const code = character.charCodeAt(0)
        return code < 32 ? `\\0${code.toString(8).padStart(3, '0')}` : character
      }).join('')
      return `  printf '%b' ${quote(text)}`
    })
    return ['{', ...input, `} | ${command}`].join('\n')
  },
}
