import type { Plugin } from '@/core'
import { convertWithHttpSnippetLite } from '@/core/utils/convertWithHttpSnippetLite'

// @ts-expect-error no types available
import { curl } from '../../../../node_modules/httpsnippet-lite/dist/esm/targets/php/curl/client.mjs'

/**
 * php/curl
 */
export const phpCurl: Plugin = {
  target: 'php',
  client: 'curl',
  generate(request) {
    // TODO: Write an own converter
    return convertWithHttpSnippetLite(curl, request)
  },
}
