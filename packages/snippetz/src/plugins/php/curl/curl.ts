import { curl } from '@/httpsnippet-lite/dist/esm/targets/php/curl/client.mjs'
import type { Plugin } from '@/types'
import { convertWithHttpSnippetLite } from '@/utils/convertWithHttpSnippetLite'

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
