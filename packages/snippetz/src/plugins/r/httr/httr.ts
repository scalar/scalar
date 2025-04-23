import { httr } from '@/httpsnippet-lite/esm/targets/r/httr/client'
import { convertWithHttpSnippetLite } from '@/utils/convert-with-http-snippet-lite'
import type { Plugin } from '@scalar/types/snippetz'

/**
 * r/httr
 */
export const rHttr: Plugin = {
  target: 'r',
  client: 'httr',
  title: 'httr',
  generate(request) {
    // TODO: Write an own converter
    return convertWithHttpSnippetLite(httr, request)
  },
}
