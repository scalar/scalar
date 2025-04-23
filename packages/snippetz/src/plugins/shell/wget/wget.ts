import { wget } from '@/httpsnippet-lite/esm/targets/shell/wget/client'
import { convertWithHttpSnippetLite } from '@/utils/convert-with-http-snippet-lite'
import type { Plugin } from '@scalar/types/snippetz'

/**
 * shell/wget
 */
export const shellWget: Plugin = {
  target: 'shell',
  client: 'wget',
  title: 'Wget',
  generate(request) {
    // TODO: Write an own converter
    return convertWithHttpSnippetLite(wget, request)
  },
}
