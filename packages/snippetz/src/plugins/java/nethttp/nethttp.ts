import { nethttp } from '@/httpsnippet-lite/esm/targets/java/nethttp/client'
import { convertWithHttpSnippetLite } from '@/utils/convertWithHttpSnippetLite'
import type { Plugin } from '@scalar/types/snippetz'

/**
 * java/nethttp
 */
export const javaNethttp: Plugin = {
  target: 'java',
  client: 'nethttp',
  title: 'java.net.http',
  generate(request) {
    // TODO: Write an own converter
    return convertWithHttpSnippetLite(nethttp, request)
  },
}
