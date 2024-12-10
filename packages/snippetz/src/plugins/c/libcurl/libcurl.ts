import { libcurl } from '@/httpsnippet-lite/dist/esm/targets/c/libcurl/client.mjs'
import type { Plugin } from '@/types'
import { convertWithHttpSnippetLite } from '@/utils/convertWithHttpSnippetLite'

/**
 * c/libcurl
 */
export const cLibcurl: Plugin = {
  target: 'c',
  client: 'libcurl',
  generate(request) {
    // TODO: Write an own converter
    return convertWithHttpSnippetLite(libcurl, request)
  },
}
