import { native } from '@/httpsnippet-lite/esm/targets/ruby/native/client'
import { convertWithHttpSnippetLite } from '@/utils/convert-with-http-snippet-lite'
import type { Plugin } from '@scalar/types/snippetz'

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
