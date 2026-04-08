import type { ApiClientModal } from '@scalar/api-client/v2/features/modal'
import type { WorkspaceStore } from '@scalar/workspace-store/client'

import { createLazyApiClientModal } from './lazy-load'
import type { ApiClientConfigurationReact } from './use-api-client'

/**
 * Module-level promise for the singleton controller.
 * Resolved once on first use; never torn down.
 */
let clientPromise: Promise<{ apiClient: ApiClientModal; workspaceStore: WorkspaceStore } | undefined> | undefined

/**
 * Lazily creates the singleton Vue app, mounts it as the last child of document.body,
 * and returns the controller. Subsequent calls return the same promise.
 */
export const getOrCreateApiClient = (
  options: ApiClientConfigurationReact = {},
): Promise<{ apiClient: ApiClientModal; workspaceStore: WorkspaceStore } | undefined> | undefined => {
  if (clientPromise) {
    return clientPromise
  }

  const host = document.createElement('div')
  host.className = 'scalar-app'
  document.body.appendChild(host)

  clientPromise = createLazyApiClientModal({ el: host, options }).catch((error) => {
    // Clear the cached promise so the next call can retry, and remove the orphaned host element.
    clientPromise = undefined
    host.remove()
    throw error
  })

  return clientPromise
}
