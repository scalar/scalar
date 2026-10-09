import type { Plugin } from '@scalar/types/snippetz'

import { multipartFileBoundary, prepareRequest } from '@/libs/prepare-request'
import { escapeSingleQuotes } from '@/libs/shell'
import { buildShellBody, quoteShellBoundary, shellBoundarySetup } from '@/libs/shell-body'

const quote = (value: string): string => `'${escapeSingleQuotes(value)}'`

/** Generates an HTTPie command, streaming multipart files without shell interpolation. */
export const shellHttpie: Plugin = {
  target: 'shell',
  client: 'httpie',
  title: 'HTTPie',
  generate(request, configuration) {
    const prepared = prepareRequest(request, configuration)
    const { url, method, headers, body } = prepared
    const boundary = multipartFileBoundary(prepared)
    const rawBody =
      body?.length === 1 && body[0] && 'text' in body[0] && !body[0].text.includes('\0') ? body[0].text : undefined
    const parts = [`http${!body || rawBody !== undefined ? ' --ignore-stdin' : ''} ${quote(method)} ${quote(url)}`]
    for (const { name, value } of headers) {
      // HTTPie uses a semicolon for an explicitly empty header; a colon unsets it.
      const escapedName = name.replaceAll('\\', '\\\\').replaceAll(':', '\\:').replaceAll(';', '\\;')
      parts.push(
        quoteShellBoundary(
          value ? `${escapedName}:${value}` : `${escapedName};`,
          name.toLowerCase() === 'content-type' ? boundary : undefined,
        ),
      )
    }
    const command = parts.join(' \\\n  ')
    if (!body) {
      return command
    }
    if (rawBody !== undefined) {
      return `${command} \\\n  --raw=${quote(rawBody)}`
    }
    return `${boundary ? shellBoundarySetup : ''}${buildShellBody(body, boundary)} | ${command}`
  },
}
