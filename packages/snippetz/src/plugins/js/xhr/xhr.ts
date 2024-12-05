import type { Plugin } from '@/types'
import { convertWithHttpSnippetLite } from '@/utils/convertWithHttpSnippetLite'
// @ts-expect-error no types available
import { xhr } from '@/httpsnippet-lite/dist/esm/targets/javascript/xhr/client.mjs'

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
