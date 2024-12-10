import { cohttp } from '@/httpsnippet-lite/dist/esm/targets/ocaml/cohttp/client.mjs'
import type { Plugin } from '@/types'
import { convertWithHttpSnippetLite } from '@/utils/convertWithHttpSnippetLite'

/**
 * ocaml/cohttp
 */
export const ocamlCohttp: Plugin = {
  target: 'ocaml',
  client: 'cohttp',
  generate(request) {
    // TODO: Write an own converter
    return convertWithHttpSnippetLite(cohttp, request)
  },
}
