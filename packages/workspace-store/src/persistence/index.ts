import { Type } from '@scalar/typebox'

import { clearStore, closeDB, deleteItem, getAllItems, getItem, hasItem, openDB, setItem } from '@/persistence/indexdb'
import { type InMemoryWorkspace, InMemoryWorkspaceSchema } from '@/schemas/inmemory-workspace'

const workspaceStoreShape = Type.Object({
  name: Type.String(),
  workspace: InMemoryWorkspaceSchema,
})

type WorkspaceStoreShape = {
  name: string
  workspace: InMemoryWorkspace
}

/**
 * Creates a persistence layer for workspace storage using IndexedDB.
 * Provides methods to save, retrieve, and manage workspace data locally.
 *
 * @returns An object with methods to interact with the workspace store
 *
 * @example
 * const persistence = await createWorkspaceStorePersistence()
 * await persistence.setItem('workspace-1', { name: 'Workspace 1', workspace: myWorkspace })
 * const workspace = await persistence.getItem('workspace-1')
 */
export const createWorkspaceStorePersistence = async () => {
  const dbName = 'workspace-store'
  const storeName = 'workspaces'
  const db = await openDB({ dbName, storeName })

  return {
    /**
     * Retrieves a workspace by its ID.
     * Returns undefined if the workspace does not exist.
     */
    getItem: async (id: string): Promise<(WorkspaceStoreShape & { id: string }) | undefined> => {
      const result = await getItem(db, storeName, id, workspaceStoreShape)
      return result
    },

    /**
     * Saves a workspace to the database.
     * If a workspace with the same ID already exists, it will be replaced.
     */
    setItem: async (id: string, value: WorkspaceStoreShape): Promise<void> => {
      await setItem(db, storeName, id, value, workspaceStoreShape)
    },

    /**
     * Deletes a workspace by its ID.
     */
    deleteItem: async (id: string): Promise<void> => {
      await deleteItem(db, storeName, id)
    },

    /**
     * Retrieves a list of all workspace id and name pairs stored in the database.
     */
    getAllItems: async (): Promise<{ id: string; name: string }[]> => {
      return getAllItems(db, storeName, Type.Object({ id: Type.String(), name: Type.String() }))
    },

    /**
     * Closes the database connection.
     * Should be called when the persistence layer is no longer needed.
     */
    close: (): void => {
      closeDB(db)
    },

    /**
     * Checks if a workspace exists in the database by its ID.
     * Returns true if the workspace exists, false otherwise.
     */
    hasItem: async (id: string): Promise<boolean> => {
      return hasItem(db, storeName, id)
    },

    /**
     * Clears the database.
     */
    clear: async (): Promise<void> => {
      await clearStore(db, storeName)
    },
  }
}
