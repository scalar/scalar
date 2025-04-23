import { okhttp } from '@/httpsnippet-lite/esm/targets/java/okhttp/client'
import { convertWithHttpSnippetLite } from '@/utils/convert-with-http-snippet-lite'
import type { Plugin } from '@scalar/types/snippetz'

/**
 * java/okhttp
 */
export const javaOkhttp: Plugin = {
  target: 'java',
  client: 'okhttp',
  title: 'OkHttp',
  generate(request) {
    // TODO: Write an own converter
    return convertWithHttpSnippetLite(okhttp, request)
  },
}
