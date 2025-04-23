import { native } from '@/httpsnippet-lite/esm/targets/go/native/client'
import { convertWithHttpSnippetLite } from '@/utils/convert-with-http-snippet-lite'
import type { Plugin } from '@scalar/types/snippetz'

/**
 * go/native
 */
export const goNative: Plugin = {
  target: 'go',
  client: 'native',
  title: 'NewRequest',
  generate(request) {
    // TODO: Write an own converter
    return convertWithHttpSnippetLite(native, request)
  },
}
