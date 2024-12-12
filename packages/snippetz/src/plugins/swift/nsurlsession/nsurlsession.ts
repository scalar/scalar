import type { Plugin } from '@/types'
import { convertWithHttpSnippetLite } from '@/utils/convertWithHttpSnippetLite'
// @ts-expect-error no types available
import { nsurlsession } from '@/httpsnippet-lite/dist/esm/targets/swift/nsurlsession/client.mjs'

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
