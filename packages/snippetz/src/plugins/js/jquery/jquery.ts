import type { Plugin } from '@/core'
import { convertWithHttpSnippetLite } from '@/core/utils/convertWithHttpSnippetLite'

// @ts-expect-error no types available
import { jquery } from '../../../../node_modules/httpsnippet-lite/dist/esm/targets/javascript/jquery/client.mjs'

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
