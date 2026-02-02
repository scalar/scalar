import { isClient } from '@scalar/api-client/v2/blocks/operation-code-sample'
import type { WorkspaceStore } from '@scalar/workspace-store/client'

import { authStorage, clientStorage } from '@/helpers/storage'

/**
 * Loads the default HTTP client from storage and applies it to the workspace.
 * Only updates if no default client is already set.
 */
export const loadClientFromStorage = (store: WorkspaceStore): void => {
  const storedClient = clientStorage().get()

  if (isClient(storedClient) && !store.workspace['x-scalar-default-client']) {
    store.update('x-scalar-default-client', storedClient)
  }
}

/**
 * Loads the authentication data from storage and applies it to the workspace.
 * Only updates if no authentication data is already set.
 */
export const loadAuthFromStorage = (store: WorkspaceStore, slug: string): void => {
  const authPersistence = authStorage()
  const auth = authPersistence.getAuth(slug)
  store.auth.load({ [slug]: auth })
}
