import type { Plugin } from '@/core'
import { convertWithHttpSnippetLite } from '@/core/utils/convertWithHttpSnippetLite'
// @ts-expect-error no types available
import { okhttp } from '~httpsnippet-lite/dist/esm/targets/java/okhttp/client.mjs'

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
