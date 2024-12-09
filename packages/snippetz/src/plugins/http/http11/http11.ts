import type { Plugin } from '@/core'
import { convertWithHttpSnippetLite } from '@/core/utils/convertWithHttpSnippetLite'

// @ts-expect-error no types available
import { http11 } from '../../../../node_modules/httpsnippet-lite/dist/esm/targets/http/http1.1/client.mjs'

/**
 * http/http1.1
 */
export const httpHttp11: Plugin = {
  target: 'http',
  client: 'http1.1',
  generate(request) {
    // TODO: Write an own converter
    return convertWithHttpSnippetLite(http11, request)
  },
}
