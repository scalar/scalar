import { httpie } from '@/httpsnippet-lite/esm/targets/shell/httpie/client'
import { convertWithHttpSnippetLite } from '@/utils/convertWithHttpSnippetLite'
import type { Plugin } from '@scalar/types/snippetz'

/**
 * shell/httpie
 */
export const shellHttpie: Plugin = {
  target: 'shell',
  client: 'httpie',
  title: 'HTTPie',
  generate(request) {
    // TODO: Write an own converter
    return convertWithHttpSnippetLite(httpie, request)
  },
}
