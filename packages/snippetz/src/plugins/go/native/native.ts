import type { Plugin } from '@/core'
import { convertWithHttpSnippetLite } from '@/core/utils/convertWithHttpSnippetLite'

// @ts-expect-error no types available
import { native } from '../../../../node_modules/httpsnippet-lite/dist/esm/targets/go/native/client.mjs'

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
