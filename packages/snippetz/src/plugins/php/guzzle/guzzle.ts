import { guzzle } from '@/httpsnippet-lite/esm/targets/php/guzzle/client'
import type { Plugin } from '@/types'
import { convertWithHttpSnippetLite } from '@/utils/convertWithHttpSnippetLite'

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
