import { type WorkspaceStore, createWorkspaceStore } from '@scalar/workspace-store/client'
import { createWorkspaceStorePersistence } from '@scalar/workspace-store/persistence'
import { persistencePlugin } from '@scalar/workspace-store/plugins/client'
import type { OpenApiDocument } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { ref } from 'vue'

import { workspaceSelector } from '@/v2/helpers/local-storage'

const DEFAULT_WORKSPACE_ID = 'default'
const DEFAULT_DEBOUNCE_DELAY = 1000

const defaultDocument = {
  openapi: '3.1.0',
  info: {
    title: 'Draft',
    version: '1.0.0',
  },
  paths: {
    '/': {
      get: {},
    },
  },
  'x-scalar-original-document-hash': 'draft',
} satisfies OpenApiDocument

const createClientStore = async ({ workspaceId }: { workspaceId: string }): Promise<WorkspaceStore> => {
  return createWorkspaceStore({
    plugins: [await persistencePlugin({ workspaceId, debounceDelay: DEFAULT_DEBOUNCE_DELAY })],
  })
}

export type Workspace = {
  name: string
  id: string
}

export const useWorkspaceSelector = () => {
  const activeWorkspace = ref<Workspace | null>(null)
  const workspaces = ref<Workspace[]>([])
  const store = ref<WorkspaceStore | null>(null)
  const localStorage = workspaceSelector()
  const persistencePromise = createWorkspaceStorePersistence()

  // biome-ignore lint/nursery/noFloatingPromises: By design, we want to wait for the workspace to be loaded before returning
  ;(async () => {
    const lastWorkspaceId = localStorage.getWorkspaceId()
    const persistence = await persistencePromise
    // Try to load the last used workspace
    if (lastWorkspaceId) {
      const result = await persistence.workspace.getItem(lastWorkspaceId)
      if (result) {
        activeWorkspace.value = { name: result.name, id: lastWorkspaceId }
        workspaces.value = (await persistence.workspace.getAll()).map((it) => ({ name: it.name, id: it.id }))
        const client = await createClientStore({ workspaceId: lastWorkspaceId })
        client.loadWorkspace(result.workspace)
        store.value = client
        return
      }
    }

    // Get all available workspaces
    const workspacesResult = await persistence.workspace.getAll()

    // Load the first available workspace
    if (workspacesResult.length > 0) {
      const id = workspacesResult[0]?.id

      if (!id) {
        // store.value = clientStore
        return
      }

      // Load the first available workspace
      const workspaceData = await persistence.workspace.getItem(id)

      if (workspaceData) {
        activeWorkspace.value = { name: workspaceData.name, id: id }
        workspaces.value = (await persistence.workspace.getAll()).map((it) => ({ name: it.name, id: it.id }))
        const client = createWorkspaceStore({
          plugins: [await persistencePlugin({ workspaceId: id, debounceDelay: 1000 })],
        })
        client.loadWorkspace(workspaceData.workspace)
        localStorage.setWorkspaceId(id)
        store.value = client
        return
      }
    }

    // If no workspaces are available, create a new one
    const client = await createClientStore({ workspaceId: DEFAULT_WORKSPACE_ID })
    await client.addDocument({
      name: 'draft',
      document: defaultDocument,
    })

    // Save the default workspace
    activeWorkspace.value = { name: 'Default Workspace', id: DEFAULT_WORKSPACE_ID }
    workspaces.value = [{ name: 'Default Workspace', id: DEFAULT_WORKSPACE_ID }]
    await persistence.workspace.setItem(DEFAULT_WORKSPACE_ID, {
      name: 'Default Workspace',
      workspace: client.exportWorkspace(),
    })
    localStorage.setWorkspaceId(DEFAULT_WORKSPACE_ID)
    store.value = client
  })()

  /**
   * Sets the current workspace by its ID.
   * Loads the workspace from persistence and updates the store.
   * Also sets the workspaceId in localStorage for future sessions.
   *
   * @param workspaceId - The ID of the workspace to set as active.
   */
  const setWorkspaceId = async (workspaceId: string): Promise<boolean> => {
    const persistence = await persistencePromise
    const result = await persistence.workspace.getItem(workspaceId)
    if (result) {
      activeWorkspace.value = { name: result.name, id: workspaceId }
      const client = await createClientStore({ workspaceId })
      client.loadWorkspace(result.workspace)
      store.value = client
      localStorage.setWorkspaceId(workspaceId)
      return true
    }
    return false
  }

  /**
   * Creates a new workspace with the given name.
   * - TODO: Slugify the name and ensure workspace ID uniqueness.
   * - Adds a default "draft" document to the new workspace.
   * - Saves the workspace in persistence and sets it as active.
   *
   * @param name - The name of the new workspace
   */
  const createWorkspace = async ({ name }: { name: string }): Promise<void> => {
    // TODO: slugify the name and make sure it's unique
    const persistence = await persistencePromise
    const client = await createClientStore({ workspaceId: name })
    await client.addDocument({
      name: 'draft',
      document: defaultDocument,
    })
    await persistence.workspace.setItem(name, {
      name: name,
      workspace: client.exportWorkspace(),
    })
    localStorage.setWorkspaceId(name)
    store.value = client
    activeWorkspace.value = { name: name, id: name }
  }

  return {
    store,
    activeWorkspace,
    workspaces,
    setWorkspaceId,
    createWorkspace,
  }
}
