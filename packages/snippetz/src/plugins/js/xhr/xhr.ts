import { xhr } from '@/httpsnippet-lite/esm/targets/javascript/xhr/client'
import type { Plugin } from '@/types'
import { convertWithHttpSnippetLite } from '@/utils/convertWithHttpSnippetLite'

/**
 * js/xhr
 */
export const jsXhr: Plugin = {
  target: 'js',
  client: 'xhr',
  generate(request) {
    // TODO: Write an own converter
    return convertWithHttpSnippetLite(xhr, request)
  },
}
