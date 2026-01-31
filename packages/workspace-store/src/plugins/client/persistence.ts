import { debounce } from '@scalar/helpers/general/debounce'

import { createWorkspaceStorePersistence } from '@/persistence'
import type { WorkspacePlugin } from '@/workspace-plugin'

/**
 * Plugin to persist workspace state changes with debounced writes.
 * Each type of change (meta, documentConfigs, documents, etc.) is debounced by key (type + workspaceId + optional documentName).
 * The debounce delay can be customized, defaults to 500ms.
 *
 * This avoids excessive writes to IndexedDB or other persistence layer when changes occur rapidly.
 */
export const persistencePlugin = async ({
  workspaceId,
  debounceDelay = 500,
  /** Maximum time in milliseconds to wait before forcing execution, even with continuous calls. */
  maxWait = 10000,
}: {
  workspaceId: string
  debounceDelay?: number
  maxWait?: number
}): Promise<WorkspacePlugin> => {
  // Create the persistence instance (e.g., IndexedDB, localForage, etc.)
  const persistence = await createWorkspaceStorePersistence()
  // Debounced execute function for batching similar state changes
  const { execute } = debounce({ delay: debounceDelay, maxWait })

  return {
    hooks: {
      /**
       * Handles all workspace state change events.
       * Each write is debounced by a composite key to prevent frequent writes for the same entity.
       */
      onWorkspaceStateChanges(event) {
        // If the event is for workspace meta data, debounce by workspaceId
        if (event.type === 'meta') {
          return execute(`meta-${workspaceId}`, () => persistence.meta.setItem(workspaceId, event.value))
        }

        // Debounce per document content and workspace
        if (event.type === 'documents') {
          return execute(`documents-${workspaceId}-${event.documentName}`, () =>
            persistence.documents.setItem(workspaceId, event.documentName, event.value),
          )
        }

        // Debounce per intermediate document and workspace
        if (event.type === 'intermediateDocuments') {
          return execute(`intermediateDocuments-${workspaceId}-${event.documentName}`, () =>
            persistence.intermediateDocuments.setItem(workspaceId, event.documentName, event.value),
          )
        }

        // Debounce per original document and workspace
        if (event.type === 'originalDocuments') {
          return execute(`originalDocuments-${workspaceId}-${event.documentName}`, () =>
            persistence.originalDocuments.setItem(workspaceId, event.documentName, event.value),
          )
        }

        // Debounce per document override and workspace
        if (event.type === 'overrides') {
          return execute(`overrides-${workspaceId}-${event.documentName}`, () =>
            persistence.overrides.setItem(workspaceId, event.documentName, event.value),
          )
        }

        // Debounce per document history and workspace
        if (event.type === 'history') {
          return execute(`history-${workspaceId}-${event.documentName}`, () =>
            persistence.history.setItem(workspaceId, event.documentName, event.value),
          )
        }

        // Debounce per document auth and workspace
        if (event.type === 'auth') {
          return execute(`auth-${workspaceId}-${event.documentName}`, () =>
            persistence.auth.setItem(workspaceId, event.documentName, event.value),
          )
        }

        // Delete document
        if (event.type === 'deleteDocument') {
          return execute(`deleteDocument-${workspaceId}-${event.documentName}`, () =>
            persistence.workspace.deleteDocument(workspaceId, event.documentName),
          )
        }

        // No action for other event types
        return
      },
    },
  }
}
