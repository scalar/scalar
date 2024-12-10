import { nsurlsession } from '@/httpsnippet-lite/esm/targets/objc/nsurlsession/client'
import type { Plugin } from '@/types'
import { convertWithHttpSnippetLite } from '@/utils/convertWithHttpSnippetLite'

/**
 * objc/nsurlsession
 */
export const objcNsurlsession: Plugin = {
  target: 'objc',
  client: 'nsurlsession',
  generate(request) {
    // TODO: Write an own converter
    return convertWithHttpSnippetLite(nsurlsession, request)
  },
}
