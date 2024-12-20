import { httpie } from '@/httpsnippet-lite/esm/targets/shell/httpie/client'
import type { Plugin } from '@/types'
import { convertWithHttpSnippetLite } from '@/utils/convertWithHttpSnippetLite'

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
