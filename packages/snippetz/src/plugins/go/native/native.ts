import { native } from '@/httpsnippet-lite/dist/esm/targets/go/native/client.mjs'
import type { Plugin } from '@/types'
import { convertWithHttpSnippetLite } from '@/utils/convertWithHttpSnippetLite'

/**
 * go/native
 */
export const goNative: Plugin = {
  target: 'go',
  client: 'native',
  generate(request) {
    // TODO: Write an own converter
    return convertWithHttpSnippetLite(native, request)
  },
}
