import type { ServerObject } from '@/schemas/v3.1/strict/openapi-document'

/**
 * Provides mutator functions for managing an array of OpenAPI ServerObject entries.
 *
 * @param target - The array of ServerObject to mutate. If not provided, mutators will be no-ops.
 * @returns An object with addServer and deleteServer methods.
 */
export const serverMutators = (target?: ServerObject[]) => {
  /**
   * Adds a new ServerObject to the target array.
   * @param server - The ServerObject to add.
   * @returns true if the server was added, false if target is undefined.
   */
  const addServer = (server: ServerObject): boolean => {
    if (!target) {
      return false
    }
    target.push(server)
    return true
  }

  /**
   * Deletes a ServerObject at the specified index from the target array.
   * @param index - The index of the server to delete.
   * @returns true if the server was deleted, false if target is undefined.
   */
  const deleteServer = (url: string): boolean => {
    if (!target) {
      return false
    }
    const newTarget = [...target.filter((it) => it.url !== url)]
    target.splice(0, target.length)
    target.push(...newTarget)
    return true
  }

  return {
    addServer,
    deleteServer,
  }
}
