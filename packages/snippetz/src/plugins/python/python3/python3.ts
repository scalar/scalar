import { python3 } from '@/httpsnippet-lite/esm/targets/python/python3/client'
import { convertWithHttpSnippetLite } from '@/utils/convertWithHttpSnippetLite'
import type { Plugin } from '@scalar/types/snippetz'

/**
 * python/python3
 */
export const pythonPython3: Plugin = {
  target: 'python',
  client: 'python3',
  title: 'http.client',
  generate(request) {
    // TODO: Write an own converter
    return convertWithHttpSnippetLite(python3, request)
  },
}
