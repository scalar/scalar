import type { Plugin } from '@scalar/types/snippetz'

import { nsurlsession } from '@/httpsnippet-lite/targets/objc/nsurlsession/client'
import { convertWithHttpSnippetLite } from '@/utils/convertWithHttpSnippetLite'

/**
 * objc/nsurlsession
 */
export const objcNsurlsession: Plugin = {
  target: 'objc',
  client: 'nsurlsession',
  title: 'NSURLSession',
  generate(request) {
    // TODO: Write an own converter
    return convertWithHttpSnippetLite(nsurlsession, request)
  },
}
