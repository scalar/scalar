import type { Plugin } from '@/types'
import { convertWithHttpSnippetLite } from '@/utils/convertWithHttpSnippetLite'
// @ts-expect-error no types available
import { native } from '@/httpsnippet-lite/dist/esm/targets/ruby/native/client.mjs'

/**
 * ruby/native
 */
export const rubyNative: Plugin = {
  target: 'ruby',
  client: 'native',
  generate(request) {
    // TODO: Write an own converter
    return convertWithHttpSnippetLite(native, request)
  },
}
