import type { Plugin } from '@/core'
import { convertWithHttpSnippetLite } from '@/core/utils/convertWithHttpSnippetLite'
// @ts-expect-error no types available
import { guzzle } from '@/httpsnippet-lite/dist/esm/targets/php/guzzle/client.mjs'

/**
 * php/guzzle
 */
export const phpGuzzle: Plugin = {
  target: 'php',
  client: 'guzzle',
  generate(request) {
    // TODO: Write an own converter
    return convertWithHttpSnippetLite(guzzle, request)
  },
}
