import { cohttp } from '@/httpsnippet-lite/esm/targets/ocaml/cohttp/client'
import { convertWithHttpSnippetLite } from '@/utils/convertWithHttpSnippetLite'
import type { Plugin } from '@scalar/types/snippetz'

/**
 * ocaml/cohttp
 */
export const ocamlCohttp: Plugin = {
  target: 'ocaml',
  client: 'cohttp',
  title: 'Cohttp',
  generate(request) {
    // TODO: Write an own converter
    return convertWithHttpSnippetLite(cohttp, request)
  },
}
