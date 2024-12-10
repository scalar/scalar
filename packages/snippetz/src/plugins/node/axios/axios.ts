import type { Plugin } from '@/core'
import { convertWithHttpSnippetLite } from '@/core/utils/convertWithHttpSnippetLite'
// @ts-expect-error no types available
import { axios } from '@/httpsnippet-lite/dist/esm/targets/node/axios/client.mjs'

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
