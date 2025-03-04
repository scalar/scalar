import { jquery } from '@/httpsnippet-lite/esm/targets/javascript/jquery/client'
import { convertWithHttpSnippetLite } from '@/utils/convertWithHttpSnippetLite'
import type { Plugin } from '@scalar/types/snippetz'

/**
 * js/jquery
 */
export const jsJquery: Plugin = {
  target: 'js',
  client: 'jquery',
  title: 'jQuery',
  generate(request) {
    // TODO: Write an own converter
    return convertWithHttpSnippetLite(jquery, request)
  },
}
