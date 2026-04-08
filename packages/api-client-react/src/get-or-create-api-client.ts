import type { ApiClientModal } from '@scalar/api-client/v2/features/modal'
import type { ApiClientConfiguration } from '@scalar/types/api-reference'
import type { WorkspaceStore } from '@scalar/workspace-store/client'

import { createLazyApiClientModal } from './lazy-load'

/**
 * Modal-level options only — document-specific fields (`url`, `content`) are intentionally
 * excluded because documents are registered separately via `workspaceStore.addDocument`.
 * Mixing them into the modal constructor would leak document config into modal settings.
 */
export type ApiClientModalOptions = Partial<Omit<ApiClientConfiguration, 'url' | 'content'>>

/**
 * Module-level promise for the singleton controller.
 * Resolved once on first use; never torn down.
 */
let clientPromise: Promise<{ apiClient: ApiClientModal; workspaceStore: WorkspaceStore } | undefined> | undefined

/**
 * Lazily creates the singleton Vue app, mounts it as the last child of document.body,
 * and returns the controller. Subsequent calls return the same promise.
 *
 * Only modal-level options (e.g. `proxyUrl`) are accepted here. Document-specific fields
 * (`url`, `content`) must be registered via `workspaceStore.addDocument` after the client
 * is ready — they are not part of the modal constructor.
 */
export const getOrCreateApiClient = (
  options: ApiClientModalOptions = {},
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
