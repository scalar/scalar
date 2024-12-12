import type { Plugin } from '@/core'
import { convertWithHttpSnippetLite } from '@/core/utils/convertWithHttpSnippetLite'
// @ts-expect-error no types available
import { nsurlsession } from '@/httpsnippet-lite/dist/esm/targets/objc/nsurlsession/client.mjs'

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
