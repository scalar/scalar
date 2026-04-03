import type { ApiClientModal } from '@scalar/api-client/v2/features/modal'
import type { ApiClientConfiguration } from '@scalar/types/api-reference'
import type { WorkspaceStore } from '@scalar/workspace-store/client'

/** Tracks which documents are/have been loaded so we dont duplicate */
const documentDict: Record<string, true> = {}

/** Exactly one of `document` (inline OpenAPI) or `url` is required. */
export type AddDocumentInput = { content?: Record<string, unknown>; url?: string }

/** We don't really need all of the content types so we just accept an object instead */
export type ReactApiClientConfiguration = Partial<Omit<ApiClientConfiguration, 'content' | 'url'> & AddDocumentInput>

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
  }) satisfies ApiClientController
