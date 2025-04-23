import { unirest } from '@/httpsnippet-lite/esm/targets/java/unirest/client'
import { convertWithHttpSnippetLite } from '@/utils/convert-with-http-snippet-lite'
import type { Plugin } from '@scalar/types/snippetz'

/**
 * java/unirest
 */
export const javaUnirest: Plugin = {
  target: 'java',
  client: 'unirest',
  title: 'Unirest',
  generate(request) {
    // TODO: Write an own converter
    return convertWithHttpSnippetLite(unirest, request)
  },
}
