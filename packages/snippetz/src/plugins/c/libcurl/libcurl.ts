import type { Plugin } from '@/core'
import { convertWithHttpSnippetLite } from '@/core/utils/convertWithHttpSnippetLite'

// @ts-expect-error no types available
import { libcurl } from '../../../../node_modules/httpsnippet-lite/dist/esm/targets/c/libcurl/client.mjs'

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
