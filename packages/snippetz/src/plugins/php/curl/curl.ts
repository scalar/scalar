import { curl } from '@/httpsnippet-lite/esm/targets/php/curl/client'
import { convertWithHttpSnippetLite } from '@/utils/convertWithHttpSnippetLite'
import type { Plugin } from '@scalar/types/snippetz'

/**
 * php/curl
 */
export const phpCurl: Plugin = {
  target: 'php',
  client: 'curl',
  title: 'cURL',
  generate(request) {
    // TODO: Write an own converter
    return convertWithHttpSnippetLite(curl, request)
  },
}
