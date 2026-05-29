import { debounce } from '@scalar/helpers/general/debounce'
import type { WorkspacePlugin } from '@scalar/workspace-store/workspace-plugin'

import { authStorage, clientStorage } from '@/helpers/storage'

/**
 * Plugin to persist workspace state changes with debounced writes.
 */
export const persistencePlugin = ({
  debounceDelay = 500,
  maxWait = 10000,
  persistAuth = false,
}: {
  debounceDelay?: number
  /** Maximum time in milliseconds to wait before forcing execution, even with continuous calls. */
  maxWait?: number
  /**
   * Determines whether authentication details should be persisted.
   * Accepts a boolean or a function that returns a boolean.
   * Allows for conditional persistence logic, e.g., based on environment or user settings.
   */
  persistAuth?: boolean | (() => boolean)
}): WorkspacePlugin => {
  // Debounced execute function for batching similar state changes
  const { execute } = debounce({ delay: debounceDelay, maxWait })
  const authPersistence = authStorage()
  const clientPersistence = clientStorage()

  const getPersistAuth = () => {
    if (typeof persistAuth === 'function') {
      return persistAuth()
    }

    return persistAuth
  }

  return {
    hooks: {
      /**
       * Handles all workspace state change events.
       * Each write is debounced by a key to prevent frequent writes for the same entity.
       */
      onWorkspaceStateChanges(event) {
        // If the event is for workspace meta data, debounce by workspaceId
        if (event.type === 'meta') {
          // Persist the meta fields
          const defaultClient = event.value['x-scalar-default-client']
          if (defaultClient !== undefined) {
            execute('x-scalar-default-client', () => clientPersistence.set(defaultClient))
          }
          return
        }

        // Persist auth and [server](TODO)
        // Use event.documentName as both the debounce key and the storage key so that
        // concurrent auth changes across multiple documents do not clobber each other and
        // the correct slug is used even when the active document has already changed.
        if (getPersistAuth() && event.type === 'auth') {
          execute(`auth-${event.documentName}`, () => authPersistence.setAuth(event.documentName, event.value))
        }

        // No action for other event types
        return
      },
    },
  }
}
