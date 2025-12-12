import type { Plugin } from '@scalar/types/snippetz'

import { jquery } from '@/httpsnippet-lite/targets/javascript/jquery/client'
import { convertWithHttpSnippetLite } from '@/utils/convertWithHttpSnippetLite'

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
