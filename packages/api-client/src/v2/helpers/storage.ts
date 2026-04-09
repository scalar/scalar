import { safeLocalStorage } from '@scalar/helpers/object/local-storage'

const CURRENT_PATH_KEY = 'scalar.currentPath' as const
const TELEMETRY_KEY = 'scalar.telemetry' as const

/**
 * Handles persistence of the active workspace ID in localStorage.
 *
 * Usage example:
 * ```ts
 * // Set the active workspace id
 * workspaceStorage.setActiveWorkspaceId('workspace-1');
 *
 * // Get the currently active workspace id
 * const id = workspaceStorage.getActiveWorkspaceId();
 * ```
 */
export const workspaceStorage = {
  /**
   * We keep the currently active path so we can reload it if needed
   */
  setCurrentPath: (path: string): void => {
    // We have an infinite redirect loop if we set the current path to the root path
    if (path === '/') {
      return
    }
    safeLocalStorage().setItem(CURRENT_PATH_KEY, path)
  },

  /**
   * Retrieve the last active path
   */
  getLastPath: (): string | null => {
    return safeLocalStorage().getItem(CURRENT_PATH_KEY)
  },

  /**
   * Persist the telemetry enabled state
   */
  setTelemetry: (enabled: boolean): void => {
    safeLocalStorage().setItem(TELEMETRY_KEY, String(enabled))
  },

  /**
   * Retrieve the persisted telemetry enabled state. Returns null if never set.
   */
  getTelemetry: (): boolean | null => {
    const value = safeLocalStorage().getItem(TELEMETRY_KEY)
    if (value === null) {
      return null
    }
    return value === 'true'
  },
} as const
