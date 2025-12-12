import type { ClientPlugin } from '@/v2/plugins'

/**
 * Apply beforeRequest hooks from all plugins sequentially.
 * Each plugin receives the result from the previous plugin, allowing them to
 * transform the request in a pipeline fashion.
 */
export const applyBeforeRequestHooks = async (request: Request, plugins: ClientPlugin[]): Promise<Request> => {
  let currentRequest = request

  for (const plugin of plugins) {
    if (plugin.hooks?.beforeRequest) {
      const modifiedRequest = await plugin.hooks.beforeRequest(currentRequest)
      currentRequest = modifiedRequest ?? currentRequest
    }
  }

  return currentRequest
}
