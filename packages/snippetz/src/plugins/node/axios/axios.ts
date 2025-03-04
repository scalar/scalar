import { axios } from '@/httpsnippet-lite/esm/targets/node/axios/client'
import { convertWithHttpSnippetLite } from '@/utils/convertWithHttpSnippetLite'
import type { Plugin } from '@scalar/types/snippetz'

/**
 * node/axios
 */
export const nodeAxios: Plugin = {
  target: 'node',
  client: 'axios',
  title: 'Axios',
  generate(request) {
    // TODO: Write an own converter
    return convertWithHttpSnippetLite(axios, request)
  },
}
