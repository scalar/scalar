import { native } from '@/httpsnippet-lite/esm/targets/ruby/native/client'
import type { Plugin } from '@/types'
import { convertWithHttpSnippetLite } from '@/utils/convertWithHttpSnippetLite'

/**
 * ruby/native
 */
export const rubyNative: Plugin = {
  target: 'ruby',
  client: 'native',
  title: 'net::http',
  generate(request) {
    // TODO: Write an own converter
    return convertWithHttpSnippetLite(native, request)
  },
}
