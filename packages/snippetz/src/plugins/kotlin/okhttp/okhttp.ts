import { okhttp } from '@/httpsnippet-lite/esm/targets/kotlin/okhttp/client'
import type { Plugin } from '@/types'
import { convertWithHttpSnippetLite } from '@/utils/convertWithHttpSnippetLite'

/**
 * kotlin/okhttp
 */
export const kotlinOkhttp: Plugin = {
  target: 'kotlin',
  client: 'okhttp',
  generate(request) {
    // TODO: Write an own converter
    return convertWithHttpSnippetLite(okhttp, request)
  },
}
