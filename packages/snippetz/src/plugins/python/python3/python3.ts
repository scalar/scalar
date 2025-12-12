import type { Plugin } from '@scalar/types/snippetz'

import { python3 } from '@/httpsnippet-lite/targets/python/python3/client'
import { convertWithHttpSnippetLite } from '@/utils/convertWithHttpSnippetLite'

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
