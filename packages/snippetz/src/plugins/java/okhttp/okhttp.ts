import { okhttp } from '@/httpsnippet-lite/esm/targets/java/okhttp/client'
import type { Plugin } from '@/types'
import { convertWithHttpSnippetLite } from '@/utils/convertWithHttpSnippetLite'

/**
 * java/okhttp
 */
export const javaOkhttp: Plugin = {
  target: 'java',
  client: 'okhttp',
  generate(request) {
    // TODO: Write an own converter
    return convertWithHttpSnippetLite(okhttp, request)
  },
}
