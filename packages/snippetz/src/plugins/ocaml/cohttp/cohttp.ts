import type { Plugin } from '@/core'
import { convertWithHttpSnippetLite } from '@/core/utils/convertWithHttpSnippetLite'
// @ts-expect-error no types available
import { cohttp } from '@/httpsnippet-lite/dist/esm/targets/ocaml/cohttp/client.mjs'

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
