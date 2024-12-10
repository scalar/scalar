import { nsurlsession } from '@/httpsnippet-lite/dist/esm/targets/swift/nsurlsession/client.mjs'
import type { Plugin } from '@/types'
import { convertWithHttpSnippetLite } from '@/utils/convertWithHttpSnippetLite'

/**
 * swift/nsurlsession
 */
export const swiftNsurlsession: Plugin = {
  target: 'swift',
  client: 'nsurlsession',
  generate(request) {
    // TODO: Write an own converter
    return convertWithHttpSnippetLite(nsurlsession, request)
  },
}
