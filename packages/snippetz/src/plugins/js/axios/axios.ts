import type { Plugin } from '@/core'
import { convertWithHttpSnippetLite } from '@/core/utils/convertWithHttpSnippetLite'
// @ts-expect-error no types available
import { axios } from '@/httpsnippet-lite/dist/esm/targets/javascript/axios/client.mjs'

/**
 * js/axios
 */
export const jsAxios: Plugin = {
  target: 'js',
  client: 'axios',
  generate(request) {
    // TODO: Write an own converter
    return convertWithHttpSnippetLite(axios, request)
  },
}
