import type { Plugin } from '@/client'
import { debounce } from '@/helpers/debounce'
import { createWorkspaceStorePersistence } from '@/persistence'

/**
 * Plugin to persist workspace state changes with debounced writes.
 * Each type of change (meta, documentConfigs, documents, etc.) is debounced by key (type + workspaceId + optional documentName).
 * The debounce delay can be customized, defaults to 500ms.
 *
 * This avoids excessive writes to IndexedDB or other persistence layer when changes occur rapidly.
 */
export const persistencePlugin = async ({
  workspaceId,
  debounceDelay,
}: {
  workspaceId: string
  debounceDelay?: number
}): Promise<Plugin> => {
  // Create the persistence instance (e.g., IndexedDB, localForage, etc.)
  const persistence = await createWorkspaceStorePersistence()
  // Debounced execute function for batching similar state changes
  const { execute } = debounce({ delay: debounceDelay ?? 500 })

  return {
    hooks: {
      /**
       * Handles all workspace state change events.
       * Each write is debounced by a composite key to prevent frequent writes for the same entity.
       */
      onWorkspaceStateChanges(event) {
        // If the event is for workspace meta data, debounce by workspaceId
        if (event.type === 'meta') {
          return execute(['meta', workspaceId], () => persistence.meta.setItem(workspaceId, event.value))
        }

        // Debounce per document config and workspace
        if (event.type === 'documentConfigs') {
          return execute(['documentConfigs', workspaceId, event.documentName], () =>
            persistence.documentConfigs.setItem(workspaceId, event.documentName, event.value),
          )
        }

            // Debounce per document content and workspace
        if (event.type === 'documents') {
          return execute(['documents', workspaceId, event.documentName], () =>
            persistence.documents.setItem(workspaceId, event.documentName, event.value),
          )
        }

            // Debounce per document meta and workspace
        if (event.type === 'documentMeta') {
          return execute(['documentMeta', workspaceId, event.documentName], () =>
            persistence.documentMeta.setItem(workspaceId, event.documentName, event.value),
          )
        }

            // Debounce per intermediate document and workspace
        if (event.type === 'intermediateDocuments') {
          return execute(['intermediateDocuments', workspaceId, event.documentName], () =>
            persistence.intermediateDocuments.setItem(workspaceId, event.documentName, event.value),
          )
        }

      // Debounce per original document and workspace
        if (event.type === 'originalDocuments') {
          return execute(['originalDocuments', workspaceId, event.documentName], () =>
            persistence.originalDocuments.setItem(workspaceId, event.documentName, event.value),
          )
        }

        // Debounce per document override and workspace
        if (event.type === 'overrides') {
          return execute(['overrides', workspaceId, event.documentName], () =>
            persistence.overrides.setItem(workspaceId, event.documentName, event.value),
          )
        }

        // No action for other event types
        return
      },
    },
  }
}
