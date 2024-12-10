import { curl } from '@/httpsnippet-lite/esm/targets/php/curl/client'
import type { Plugin } from '@/types'
import { convertWithHttpSnippetLite } from '@/utils/convertWithHttpSnippetLite'

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
