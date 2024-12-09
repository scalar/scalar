import type { Plugin } from '@/core'
import { convertWithHttpSnippetLite } from '@/core/utils/convertWithHttpSnippetLite'

// @ts-expect-error no types available
import { unirest } from '../../../../node_modules/httpsnippet-lite/dist/esm/targets/java/unirest/client.mjs'

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
