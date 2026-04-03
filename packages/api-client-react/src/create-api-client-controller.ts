import type { ApiClientModal } from '@scalar/api-client/v2/features/modal'
import type { WorkspaceStore } from '@scalar/workspace-store/client'

/** Tracks which documents are/have been loaded so we dont duplicate */
const documentDict: Record<string, true> = {}

/** Exactly one of `document` (inline OpenAPI) or `url` is required. */
export type AddDocumentInput = { document: Record<string, unknown> } | { url: string }

export type ApiClientController = ApiClientModal & {
  store: WorkspaceStore
  addDocument: (input: AddDocumentInput) => void
}

/** Create a new API client controller */
export const createApiClientController = (apiClient: ApiClientModal, workspaceStore: WorkspaceStore) =>
  ({
    ...apiClient,
    store: workspaceStore,
    addDocument: (input) => {
      const documentKey =
        'url' in input ? input.url : (input.document as { info?: { title?: string } })?.info?.title || ''

      // Ensure we only load each document once
      if (documentDict[documentKey]) {
        return
      }
      documentDict[documentKey] = true

      void workspaceStore.addDocument(
        'document' in input
          ? {
              name: documentKey,
              document: input.document,
            }
          : {
              name: documentKey,
              url: input.url,
            },
      )
    },
  }) satisfies ApiClientController
