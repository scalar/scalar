import { native } from '@/httpsnippet-lite/esm/targets/go/native/client'
import type { Plugin } from '@/types'
import { convertWithHttpSnippetLite } from '@/utils/convertWithHttpSnippetLite'

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
