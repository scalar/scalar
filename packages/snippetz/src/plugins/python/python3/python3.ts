import type { Plugin } from '@/core'
import { convertWithHttpSnippetLite } from '@/core/utils/convertWithHttpSnippetLite'
// @ts-expect-error no types available
import { python3 } from '~httpsnippet-lite/dist/esm/targets/python/python3/client.mjs'

/**
 * python/python3
 */
export const pythonPython3: Plugin = {
  target: 'python',
  client: 'python3',
  generate(request) {
    // TODO: Write an own converter
    return convertWithHttpSnippetLite(python3, request)
  },
}
