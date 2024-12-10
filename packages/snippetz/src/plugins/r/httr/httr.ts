import { httr } from '@/httpsnippet-lite/esm/targets/r/httr/client'
import type { Plugin } from '@/types'
import { convertWithHttpSnippetLite } from '@/utils/convertWithHttpSnippetLite'

/**
 * r/httr
 */
export const rHttr: Plugin = {
  target: 'r',
  client: 'httr',
  generate(request) {
    // TODO: Write an own converter
    return convertWithHttpSnippetLite(httr, request)
  },
}
