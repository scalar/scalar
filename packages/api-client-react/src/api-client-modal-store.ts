import type { ApiClientController, ReactApiClientConfiguration } from './create-api-client-controller'
import { createApiClientController } from './create-api-client-controller'
import { createLazyApiClientModal } from './lazy-load'

/**
 * Module-level promise for the singleton controller.
 * Resolved once on first use; never torn down.
 */
let controllerPromise: Promise<ApiClientController> | undefined

/**
 * Lazily creates the singleton Vue app, mounts it as the last child of document.body,
 * and returns the controller. Subsequent calls return the same promise.
 */
export const getOrCreateApiClientController = (
  options: ReactApiClientConfiguration = {},
): Promise<ApiClientController> => {
  if (controllerPromise) {
    return controllerPromise
  }

  controllerPromise = (async () => {
    const host = document.createElement('div')
    host.className = 'scalar-app'
    document.body.appendChild(host)

    const { apiClient, workspaceStore } = await createLazyApiClientModal({ el: host, options })
    return createApiClientController(apiClient, workspaceStore)
  })()

  return controllerPromise
}
