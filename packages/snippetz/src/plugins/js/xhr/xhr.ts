import { xhr } from '@/httpsnippet-lite/esm/targets/javascript/xhr/client'
import { convertWithHttpSnippetLite } from '@/utils/convert-with-http-snippet-lite'
import type { Plugin } from '@scalar/types/snippetz'

/**
 * js/xhr
 */
export const jsXhr: Plugin = {
  target: 'js',
  client: 'xhr',
  title: 'XHR',
  generate(request) {
    // TODO: Write an own converter
    return convertWithHttpSnippetLite(xhr, request)
  },
}
