import { unirest } from '@/httpsnippet-lite/dist/esm/targets/java/unirest/client.mjs'
import type { Plugin } from '@/types'
import { convertWithHttpSnippetLite } from '@/utils/convertWithHttpSnippetLite'

/**
 * java/unirest
 */
export const javaUnirest: Plugin = {
  target: 'java',
  client: 'unirest',
  generate(request) {
    // TODO: Write an own converter
    return convertWithHttpSnippetLite(unirest, request)
  },
}
