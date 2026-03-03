import type { Plugin } from '@scalar/types/snippetz'

import { requestsLikeGenerate } from '@/plugins/python/requestsLike'

/**
 * python/requests
 */
export const pythonRequests: Plugin = {
  target: 'python',
  targetTitle: 'Python',
  client: 'requests',
  title: 'Requests',
  generate(request, configuration) {
    return requestsLikeGenerate('requests', request, configuration)
  },
}
