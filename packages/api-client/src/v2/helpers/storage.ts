import { safeLocalStorage } from '@scalar/helpers/object/local-storage'

const ACTIVE_WORKSPACE_ID_KEY = 'scalar.activeWorkspaceId' as const

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
   * Retrieves the active workspace ID from localStorage.
   * @returns {string | undefined} The currently active workspace ID, or undefined if not set.
   */
  getActiveWorkspaceId(): string | undefined {
    return safeLocalStorage().getItem(ACTIVE_WORKSPACE_ID_KEY) ?? undefined
  },

  /**
   * Stores the given workspace ID as the active workspace in localStorage.
   * @param {string} id - The workspace ID to set as active.
   */
  setActiveWorkspaceId(id: string): void {
    safeLocalStorage().setItem(ACTIVE_WORKSPACE_ID_KEY, id)
  },
} as const
