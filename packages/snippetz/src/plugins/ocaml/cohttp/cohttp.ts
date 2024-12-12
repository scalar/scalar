import { cohttp } from '@/httpsnippet-lite/esm/targets/ocaml/cohttp/client'
import type { Plugin } from '@/types'
import { convertWithHttpSnippetLite } from '@/utils/convertWithHttpSnippetLite'

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
