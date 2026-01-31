import { debounce } from '@scalar/helpers/general/debounce'
import type { WorkspacePlugin } from '@scalar/workspace-store/workspace-plugin'

import { authStorage } from '@/helpers'

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
        // Persist auth
        if (getPersistAuth() && event.type === 'auth') {
          execute('auth', () => authPersistence.setAuth(event.documentName, event.value))
        }

        // No action for other event types
        return
      },
    },
  }
}
