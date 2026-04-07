import type { ApiClientModal } from '@scalar/api-client/v2/features/modal'
import type { ApiClientConfiguration } from '@scalar/types/api-reference'
import type { WorkspaceStore } from '@scalar/workspace-store/client'

import { createLazyApiClientModal } from './lazy-load'

/** Tracks which documents are/have been loaded so we dont duplicate */
const documentDict: Record<string, true> = {}

/** Exactly one of `document` (inline OpenAPI) or `url` is required. */
export type AddDocumentInput = { content?: Record<string, unknown>; url?: string }

/** We don't really need all of the content types so we just accept an object instead */
export type ReactApiClientConfiguration = Partial<Omit<ApiClientConfiguration, 'content' | 'url'> & AddDocumentInput>

export type ApiClient = ApiClientModal & {
  store: WorkspaceStore
  addDocument: (input: AddDocumentInput) => void
}

/** Create a new API client controller */
export const createApiClient = (apiClient: ApiClientModal, workspaceStore: WorkspaceStore) =>
  ({
    ...apiClient,
    store: workspaceStore,
    addDocument: (input) => {
      const documentKey = input.url || (input.content as { info?: { title?: string } })?.info?.title || ''

      // Ensure we only load each document once
      if (documentDict[documentKey]) {
        return
      }
      documentDict[documentKey] = true

      void workspaceStore.addDocument(
        input.content
          ? {
              name: documentKey,
              document: input.content,
            }
          : {
              name: documentKey,
              url: input.url ?? '',
            },
      )
    },
  }) satisfies ApiClient

/**
 * Module-level promise for the singleton controller.
 * Resolved once on first use; never torn down.
 */
let controllerPromise: Promise<ApiClient> | undefined

/**
 * Lazily creates the singleton Vue app, mounts it as the last child of document.body,
 * and returns the controller. Subsequent calls return the same promise.
 */
export const getOrCreateApiClient = (options: ReactApiClientConfiguration = {}): Promise<ApiClient> => {
  if (controllerPromise) {
    return controllerPromise
  }

  controllerPromise = (async () => {
    console.log('debug: creating api client')
    const host = document.createElement('div')
    host.className = 'scalar-app'
    document.body.appendChild(host)

    const { apiClient, workspaceStore } = await createLazyApiClientModal({ el: host, options })
    return createApiClient(apiClient, workspaceStore)
  })()

  return controllerPromise
}
