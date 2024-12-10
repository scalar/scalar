import { axios } from '@/httpsnippet-lite/esm/targets/javascript/axios/client.mjs'
import type { Plugin } from '@/types'
import { convertWithHttpSnippetLite } from '@/utils/convertWithHttpSnippetLite'

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
