import type { Plugin } from '@/types'
import { convertWithHttpSnippetLite } from '@/utils/convertWithHttpSnippetLite'
// @ts-expect-error no types available
import { requests } from '@/httpsnippet-lite/dist/esm/targets/python/requests/client.mjs'

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
