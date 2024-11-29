import type { Plugin } from '@/core'
import { convertWithHttpSnippetLite } from '@/core/utils/convertWithHttpSnippetLite'
// @ts-expect-error no types available
import { clj_http } from '~httpsnippet-lite/dist/esm/targets/clojure/clj_http/client.mjs'

/**
 * clojure/clj_http
 */
export const clojureCljhttp: Plugin = {
  target: 'clojure',
  client: 'clj_http',
  generate(request) {
    // TODO: Write an own converter
    return convertWithHttpSnippetLite(clj_http, request)
  },
}
