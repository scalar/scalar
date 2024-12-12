import { nsurlsession } from '@/httpsnippet-lite/esm/targets/swift/nsurlsession/client'
import type { Plugin } from '@/types'
import { convertWithHttpSnippetLite } from '@/utils/convertWithHttpSnippetLite'

/**
 * swift/nsurlsession
 */
export const swiftNsurlsession: Plugin = {
  target: 'swift',
  client: 'nsurlsession',
  title: 'NSURLSession',
  generate(request) {
    // TODO: Write an own converter
    return convertWithHttpSnippetLite(nsurlsession, request)
  },
}
