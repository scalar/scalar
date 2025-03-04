import { guzzle } from '@/httpsnippet-lite/esm/targets/php/guzzle/client'
import { convertWithHttpSnippetLite } from '@/utils/convertWithHttpSnippetLite'
import type { Plugin } from '@scalar/types/snippetz'

/**
 * php/guzzle
 */
export const phpGuzzle: Plugin = {
  target: 'php',
  client: 'guzzle',
  title: 'Guzzle',
  generate(request) {
    // TODO: Write an own converter
    return convertWithHttpSnippetLite(guzzle, request)
  },
}
