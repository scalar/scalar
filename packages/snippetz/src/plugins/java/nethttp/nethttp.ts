import type { Plugin } from '@/core'
import { convertWithHttpSnippetLite } from '@/core/utils/convertWithHttpSnippetLite'

// @ts-expect-error no types available
import { nethttp } from '../../../../node_modules/httpsnippet-lite/dist/esm/targets/java/nethttp/client.mjs'

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
