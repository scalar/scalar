import { nethttp } from '@/httpsnippet-lite/esm/targets/java/nethttp/client'
import type { Plugin } from '@/types'
import { convertWithHttpSnippetLite } from '@/utils/convertWithHttpSnippetLite'

/**
 * java/nethttp
 */
export const javaNethttp: Plugin = {
  target: 'java',
  client: 'nethttp',
  generate(request) {
    // TODO: Write an own converter
    return convertWithHttpSnippetLite(nethttp, request)
  },
}
