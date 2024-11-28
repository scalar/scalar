import type { Plugin } from '@/core'
import { convertWithHttpSnippetLite } from '@/core/utils/convertWithHttpSnippetLite'
// @ts-expect-error no types available
import { wget } from '~httpsnippet-lite/dist/esm/targets/shell/wget/client.mjs'

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
