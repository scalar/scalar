import type { Plugin } from '@/types'
import { convertWithHttpSnippetLite } from '@/utils/convertWithHttpSnippetLite'
// @ts-expect-error no types available
import { httpie } from '@/httpsnippet-lite/dist/esm/targets/shell/httpie/client.mjs'

/**
 * shell/httpie
 */
export const shellHttpie: Plugin = {
  target: 'shell',
  client: 'httpie',
  generate(request) {
    // TODO: Write an own converter
    return convertWithHttpSnippetLite(httpie, request)
  },
}
