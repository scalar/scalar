/**
 * @description
 * HTTP code snippet generator for the Shell using Wget.
 *
 * @author
 * @AhmadNassri
 *
 * for any questions or issues regarding the generated code snippet, please open an issue mentioning the author.
 */

import { CodeBuilder } from '@/httpsnippet-lite/helpers/code-builder'
import { shellEscape, shellQuote } from '@/httpsnippet-lite/helpers/shell'
import type { Client } from '@/httpsnippet-lite/targets/target'

export const wget: Client = {
  info: {
    key: 'wget',
    title: 'Wget',
    link: 'https://www.gnu.org/software/wget/',
    description: 'a free software package for retrieving files using HTTP, HTTPS',
  },
  convert: ({ method, postData, allHeaders, fullUrl }, options) => {
    const opts = {
      indent: '  ',
      short: false,
      verbose: false,
      ...options,
    }
    const { push, join } = new CodeBuilder({
      indent: opts.indent,
      // @ts-expect-error SEEMS LEGIT
      join: opts.indent !== false ? ` \\\n${opts.indent}` : ' ',
    })
    if (opts.verbose) {
      push(`wget ${opts.short ? '-v' : '--verbose'}`)
    } else {
      push(`wget ${opts.short ? '-q' : '--quiet'}`)
    }
    push(`--method ${shellQuote(method)}`)
    Object.keys(allHeaders).forEach((key) => {
      const header = `${key}: ${allHeaders[key]}`
      push(`--header ${shellQuote(header)}`)
    })
    if (postData === null || postData === void 0 ? void 0 : postData.text) {
      push(`--body-data ${shellEscape(shellQuote(postData!.text))}`)
    }
    push(opts.short ? '-O' : '--output-document')
    push(`- ${shellQuote(fullUrl)}`)
    return join()
  },
}
