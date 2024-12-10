import type { Plugin } from '@/core'
import { convertWithHttpSnippetLite } from '@/core/utils/convertWithHttpSnippetLite'
// @ts-expect-error no types available
import { okhttp } from '@/httpsnippet-lite/dist/esm/targets/kotlin/okhttp/client.mjs'

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
