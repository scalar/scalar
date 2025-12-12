import type { Plugin } from '@scalar/types/snippetz'

import { okhttp } from '@/httpsnippet-lite/targets/kotlin/okhttp/client'
import { convertWithHttpSnippetLite } from '@/utils/convertWithHttpSnippetLite'

/**
 * kotlin/okhttp
 */
export const kotlinOkhttp: Plugin = {
  target: 'kotlin',
  client: 'okhttp',
  title: 'OkHttp',
  generate(request) {
    // TODO: Write an own converter
    return convertWithHttpSnippetLite(okhttp, request)
  },
}
