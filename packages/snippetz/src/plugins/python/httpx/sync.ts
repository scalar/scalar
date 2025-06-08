import type { Plugin } from '@scalar/types/snippetz'
import { requestsLikeGenerate } from '@/plugins/python/requestsLike'

/**
 * python/httpx_sync
 */
export const pythonHttpxSync: Plugin = {
  target: 'python',
  client: 'httpx_sync',
  title: 'HTTPX (Sync)',
  generate(request, configuration) {
    return requestsLikeGenerate('httpx', request, configuration)
  },
}
