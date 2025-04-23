import { clj_http } from '@/httpsnippet-lite/esm/targets/clojure/clj_http/client'
import { convertWithHttpSnippetLite } from '@/utils/convertWithHttpSnippetLite'
import type { Plugin } from '@scalar/types/snippetz'

/**
 * clojure/clj_http
 */
export const clojureCljhttp: Plugin = {
  target: 'clojure',
  client: 'clj_http',
  title: 'clj-http',
  generate(request) {
    // TODO: Write an own converter
    return convertWithHttpSnippetLite(clj_http, request)
  },
}
