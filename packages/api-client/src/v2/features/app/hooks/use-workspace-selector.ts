import { type WorkspaceStore, createWorkspaceStore } from '@scalar/workspace-store/client'
import { generateUniqueValue } from '@scalar/workspace-store/helpers/generate-unique-value'
import { createWorkspaceStorePersistence } from '@scalar/workspace-store/persistence'
import { persistencePlugin } from '@scalar/workspace-store/plugins/client'
import type { OpenApiDocument } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { type Ref, ref } from 'vue'
import { useRouter } from 'vue-router'

import { slugify } from '@/v2/helpers/slugify'

const DEFAULT_DEBOUNCE_DELAY = 1000

/**
 * Default workspace meta used when we need to create or navigate to a fallback workspace.
 * Keep in sync with the persisted workspace structure.
 */
export const DEFAULT_WORKSPACE: Workspace = {
  name: 'Default Workspace',
  id: 'default',
}

const defaultDocument = {
  openapi: '3.1.0',
  info: {
    title: 'Drafts',
    version: '1.0.0',
  },
  paths: {
    '/': {
      get: {},
    },
  },
  'x-scalar-original-document-hash': 'drafts',
  'x-scalar-icon': 'interface-edit-tool-pencil',
} satisfies OpenApiDocument

/**
 * Creates a client-side workspace store with persistence enabled for the given workspace id.
 */
const createClientStore = async ({ workspaceId }: { workspaceId: string }): Promise<WorkspaceStore> => {
  return createWorkspaceStore({
    plugins: [await persistencePlugin({ workspaceId, debounceDelay: DEFAULT_DEBOUNCE_DELAY })],
  })
}

export type Workspace = {
  name: string
  id: string
}

export type UseWorkspaceSelectorReturn = {
  activeWorkspace: Ref<Workspace | null>
  workspaces: Ref<Workspace[]>
  store: Ref<WorkspaceStore | null>
  setWorkspaceId: (id: string) => Promise<void>
  createWorkspace: (props: { name: string }) => Promise<Workspace | undefined>
  loadWorkspace: (id: string) => Promise<{ success: true; workspace: WorkspaceStore } | { success: false }>
}

export const useWorkspaceSelector = (): UseWorkspaceSelectorReturn => {
  const activeWorkspace = ref<Workspace | null>(null)
  const workspaces = ref<Workspace[]>([])
  const store = ref<WorkspaceStore | null>(null)
  const persistencePromise = createWorkspaceStorePersistence()

  const router = useRouter()

  /**
   * Attempts to load and activate a workspace by id.
   * Returns true when the workspace was found and activated.
   */
  const loadWorkspace: UseWorkspaceSelectorReturn['loadWorkspace'] = async (id) => {
    const persistence = await persistencePromise
    const workspace = await persistence.workspace.getItem(id)

    if (!workspace) {
      return {
        success: false,
      }
    }

    const client = await createClientStore({ workspaceId: id })
    client.loadWorkspace(workspace.workspace)
    activeWorkspace.value = { id, name: workspace.name }
    store.value = client

    return {
      success: true,
      workspace: client,
    }
  }

  /**
   * Creates and persists the default workspace with a blank draft document.
   * Used when no workspaces exist yet.
   */
  const createAndPersistWorkspace = async ({ id, name }: { id: string; name: string }): Promise<void> => {
    const draftStore = createWorkspaceStore()
    await draftStore.addDocument({
      name: 'drafts',
      document: defaultDocument,
    })

    const persistence = await persistencePromise
    await persistence.workspace.setItem(id, {
      name: name,
      workspace: draftStore.exportWorkspace(),
    })

    // Update the workspace list
    workspaces.value.push({ id, name })
  }

  /**
   * Updates the route to reflect the currently selected workspace.
   * Navigates to the workspace's main environment view, with an option to control
   * whether the previous route path should be loaded via a query parameter.
   *
   * @param id - The workspace slug (unique identifier) to navigate to.
   * @param loadFromSession - If true, includes "loadFromSession=true" in the query to indicate state/session should be restored.
   */
  const setWorkspaceId = async (id: string): Promise<void> => {
    await router.push({
      name: 'workspace.environment',
      params: { workspaceSlug: id },
    })
  }

  /**
   * Creates a new workspace with the provided name.
   * - Generates a unique ID for the workspace (sluggified from the name and guaranteed unique).
   * - Adds a default blank document ("drafts") to the workspace.
   * - Persists the workspace and navigates to it.
   *
   * Example usage:
   *   await createWorkspace({ name: 'My Awesome API' })
   *   // -> Navigates to /workspace/my-awesome-api (if available)
   */
  const createWorkspace = async ({ id, name }: { id?: string; name: string }): Promise<Workspace | undefined> => {
    // Clear up the current store, in order to show the loading state
    store.value = null

    const persistence = await persistencePromise

    // Generate a unique slug/id for the workspace, based on the name.
    const newWorkspaceId = await generateUniqueValue({
      defaultValue: id ?? name, // Use the provided id if it exists, otherwise use the name
      validation: async (value) => !(await persistence.workspace.has(value)),
      maxRetries: 100,
      transformation: slugify,
    })

    // Failed to generate a unique workspace id, so we can't create the workspace.
    if (!newWorkspaceId) {
      return undefined
    }

    const newWorkspaceDetails = { id: newWorkspaceId, name }

    // Create a new client store with the workspace ID and add a default document.
    await createAndPersistWorkspace(newWorkspaceDetails)

    // Navigate to the newly created workspace.
    await setWorkspaceId(newWorkspaceId)
    return newWorkspaceDetails
  }

  /** Update the workspace list when the component is mounted */
  // biome-ignore lint/nursery/noFloatingPromises: run the function immediately
  ;(async () => {
    // Try to update the workspace list
    const persistence = await persistencePromise

    const result = await persistence.workspace.getAll()
    workspaces.value = result
  })()

  return {
    store,
    activeWorkspace,
    workspaces,
    setWorkspaceId,
    createWorkspace,
    loadWorkspace,
  }
}
