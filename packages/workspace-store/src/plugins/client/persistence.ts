import { debounce } from '@scalar/helpers/general/debounce'

import { createWorkspaceStorePersistence } from '@/persistence'
import type { WorkspacePlugin } from '@/workspace-plugin'

const pendingFlushes = new Set<() => void>()
// Flag to ensure lifecycle event listeners are only initialized once
let persistenceLifecycleListenersInitialized = false

/**
 * Runs (calls) all pending flush functions.
 */
const runPendingFlushes = (): void => {
  for (const flush of pendingFlushes) {
    flush() // Call the flush function
  }
}

/**
 * Adds event listeners to ensure flushing on important lifecycle events
 * (like navigation away or page hide). Ensures they're registered only once.
 */
const initializePersistenceLifecycleListeners = (): void => {
  // Avoid adding listeners multiple times or during SSR/non-browser environments
  if (persistenceLifecycleListenersInitialized || typeof window === 'undefined' || typeof document === 'undefined') {
    return
  }

  persistenceLifecycleListenersInitialized = true
  // Trigger flush on pagehide (browser is unloading or navigating away)
  window.addEventListener('pagehide', runPendingFlushes)
  // Also trigger flush on beforeunload as a fallback
  window.addEventListener('beforeunload', runPendingFlushes)
  // For SPAs: trigger flush when the page goes hidden (such as switching tabs)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      runPendingFlushes()
    }
  })
}

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
  const { execute, flushAll } = debounce({ delay: debounceDelay, maxWait })

  pendingFlushes.add(flushAll)
  initializePersistenceLifecycleListeners()

  const dispose = (): void => {
    // Flush any pending writes and clear timers before removing from the set.
    // Otherwise pending data can be lost if the workspace is torn down and a
    // lifecycle event (e.g. pagehide) never fires or fires after the callback was removed.
    flushAll()
    pendingFlushes.delete(flushAll)
  }

  return {
    dispose,
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
