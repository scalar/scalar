import type { Plugin } from '@scalar/types/snippetz'

import { unirest } from '@/httpsnippet-lite/targets/java/unirest/client'
import { convertWithHttpSnippetLite } from '@/utils/convertWithHttpSnippetLite'

/**
 * java/unirest
 */
export const javaUnirest: Plugin = {
  target: 'java',
  targetTitle: 'Java',
  client: 'unirest',
  title: 'Unirest',
  generate(request) {
    // TODO: Write an own converter
    return convertWithHttpSnippetLite(unirest, request)
  },
}
