import { clj_http } from '@/httpsnippet-lite/esm/targets/clojure/clj_http/client'
import type { Plugin } from '@/types'
import { convertWithHttpSnippetLite } from '@/utils/convertWithHttpSnippetLite'

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
