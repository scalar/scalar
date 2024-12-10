import { native } from '@/httpsnippet-lite/dist/esm/targets/ruby/native/client.mjs'
import type { Plugin } from '@/types'
import { convertWithHttpSnippetLite } from '@/utils/convertWithHttpSnippetLite'

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
