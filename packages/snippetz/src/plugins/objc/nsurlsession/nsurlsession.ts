import { nsurlsession } from '@/httpsnippet-lite/esm/targets/objc/nsurlsession/client'
import { convertWithHttpSnippetLite } from '@/utils/convert-with-http-snippet-lite'
import type { Plugin } from '@scalar/types/snippetz'

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
