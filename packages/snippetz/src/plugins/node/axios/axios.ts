import { axios } from '@/httpsnippet-lite/dist/esm/targets/node/axios/client.mjs'
import type { Plugin } from '@/types'
import { convertWithHttpSnippetLite } from '@/utils/convertWithHttpSnippetLite'

/**
 * node/axios
 */
export const nodeAxios: Plugin = {
  target: 'node',
  client: 'axios',
  generate(request) {
    // TODO: Write an own converter
    return convertWithHttpSnippetLite(axios, request)
  },
}
