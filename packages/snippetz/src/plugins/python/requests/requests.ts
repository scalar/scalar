import { requests } from '@/httpsnippet-lite/esm/targets/python/requests/client'
import { convertWithHttpSnippetLite } from '@/utils/convertWithHttpSnippetLite'
import type { Plugin } from '@scalar/types/snippetz'

/**
 * python/requests
 */
export const pythonRequests: Plugin = {
  target: 'python',
  client: 'requests',
  title: 'Requests',
  generate(request) {
    // TODO: Write an own converter
    return convertWithHttpSnippetLite(requests, request)
  },
}
