import { requests } from '@/httpsnippet-lite/esm/targets/python/requests/client'
import type { Plugin } from '@/types'
import { convertWithHttpSnippetLite } from '@/utils/convertWithHttpSnippetLite'

/**
 * python/requests
 */
export const pythonRequests: Plugin = {
  target: 'python',
  client: 'requests',
  generate(request) {
    // TODO: Write an own converter
    return convertWithHttpSnippetLite(requests, request)
  },
}
