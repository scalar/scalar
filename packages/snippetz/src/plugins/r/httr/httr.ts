import type { Plugin } from '@/core'
import { convertWithHttpSnippetLite } from '@/core/utils/convertWithHttpSnippetLite'
// @ts-expect-error no types available
import { httr } from '~httpsnippet-lite/dist/esm/targets/r/httr/client.mjs'

/**
 * ruby/httr
 */
export const rHttr: Plugin = {
  target: 'r',
  client: 'httr',
  generate(request) {
    // TODO: Write an own converter
    return convertWithHttpSnippetLite(httr, request)
  },
}
