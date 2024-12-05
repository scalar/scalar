import type { Plugin } from '@/types'
import { convertWithHttpSnippetLite } from '@/utils/convertWithHttpSnippetLite'
// @ts-expect-error no types available
import { jquery } from '@/httpsnippet-lite/dist/esm/targets/javascript/jquery/client.mjs'

/**
 * js/jquery
 */
export const jsJquery: Plugin = {
  target: 'js',
  client: 'jquery',
  generate(request) {
    // TODO: Write an own converter
    return convertWithHttpSnippetLite(jquery, request)
  },
}
