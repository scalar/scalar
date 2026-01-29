import { debounce } from '@scalar/helpers/general/debounce'
import type { WorkspacePlugin } from '@scalar/workspace-store/workspace-plugin'

import { authStorage, clientStorage } from '@/helpers/storage'

/**
 * Plugin to persist workspace state changes with debounced writes.
 */
export const persistencePlugin = ({
  debounceDelay = 500,
  maxWait = 10000,
  prefix = '',
  persistAuth = false,
}: {
  debounceDelay?: number
  /** Maximum time in milliseconds to wait before forcing execution, even with continuous calls. */
  maxWait?: number
  /**
   * Prefix to use for local storage keys.
   * This can be a string or a function returning a string.
   * For example, to persist data per document, use the document name as the prefix.
   */
  prefix?: string | (() => string)
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

  /**
   * Resolves the prefix to use for local storage keys.
   * If 'prefix' is a string, returns it directly.
   * If 'prefix' is a function, calls and returns its value.
   */
  const getPrefix = () => {
    if (typeof prefix === 'string') {
      return prefix
    }

    return prefix()
  }

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
        if (getPersistAuth() && event.type === 'auth') {
          execute('auth', () => authPersistence.setAuth(getPrefix(), event.value))
        }

        // No action for other event types
        return
      },
    },
  }
}
