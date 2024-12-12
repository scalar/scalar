import type { Plugin } from '@/types'
import { convertWithHttpSnippetLite } from '@/utils/convertWithHttpSnippetLite'
// @ts-expect-error no types available
import { nethttp } from '@/httpsnippet-lite/dist/esm/targets/java/nethttp/client.mjs'

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
