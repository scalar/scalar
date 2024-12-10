import { wget } from '@/httpsnippet-lite/dist/esm/targets/shell/wget/client.mjs'
import type { Plugin } from '@/types'
import { convertWithHttpSnippetLite } from '@/utils/convertWithHttpSnippetLite'

/**
 * shell/wget
 */
export const shellWget: Plugin = {
  target: 'shell',
  client: 'wget',
  generate(request) {
    // TODO: Write an own converter
    return convertWithHttpSnippetLite(wget, request)
  },
}
