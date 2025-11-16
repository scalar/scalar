import { type WorkspaceStore, createWorkspaceStore } from '@scalar/workspace-store/client'
import { generateUniqueValue } from '@scalar/workspace-store/helpers/generate-unique-value'
import { createWorkspaceStorePersistence } from '@scalar/workspace-store/persistence'
import { persistencePlugin } from '@scalar/workspace-store/plugins/client'
import type { OpenApiDocument } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { type MaybeRefOrGetter, type Ref, ref, toValue, watch } from 'vue'
import { useRouter } from 'vue-router'

import { slugify } from '@/v2/helpers/slugify'
import { workspaceStorage } from '@/v2/helpers/storage'

const DEFAULT_DEBOUNCE_DELAY = 1000

/**
 * Default workspace meta used when we need to create or navigate to a fallback workspace.
 * Keep in sync with the persisted workspace structure.
 */
const DEFAULT_WORKSPACE: Workspace = {
  name: 'Default',
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

export const useWorkspaceSelector = ({
  workspaceId,
}: {
  workspaceId: MaybeRefOrGetter<string | undefined>
}): {
  activeWorkspace: Ref<Workspace | null>
  workspaces: Ref<Workspace[]>
  store: Ref<WorkspaceStore | null>
  setWorkspaceId: (id: string) => void
  createWorkspace: (props: { name: string }) => Promise<void>
} => {
  const activeWorkspace = ref<Workspace | null>(null)
  const workspaces = ref<Workspace[]>([])
  const store = ref<WorkspaceStore | null>(null)
  const persistencePromise = createWorkspaceStorePersistence()

  const router = useRouter()

  /**
   * Attempts to load and activate a workspace by id.
   * Returns true when the workspace was found and activated.
   */
  const loadWorkspace = async (id: string): Promise<boolean> => {
    const persistence = await persistencePromise
    const workspace = await persistence.workspace.getItem(id)

    if (!workspace) {
      return false
    }

    const client = await createClientStore({ workspaceId: id })
    client.loadWorkspace(workspace.workspace)
    workspaceStorage.setActiveWorkspaceId(id)
    activeWorkspace.value = { id, name: workspace.name }
    store.value = client
    return true
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

    // For the dev mode we might want couple more documents for testing purpose
    // TODO: remove as soon as the command palette is implemented
    if (import.meta.env.DEV) {
      await draftStore.addDocument({
        name: 'scalar-galaxy',
        url: 'https://galaxy.scalar.com/openapi.yaml',
      })

      await draftStore.addDocument({
        name: 'swagger-petstore-3-0',
        url: 'https://petstore3.swagger.io/api/v3/openapi.json',
      })
    }

    const persistence = await persistencePromise
    await persistence.workspace.setItem(id, {
      name: name,
      workspace: draftStore.exportWorkspace(),
    })
  }

  watch(
    () => toValue(workspaceId),
    async (newWorkspaceId): Promise<void> => {
      const id = newWorkspaceId
      const persistence = await persistencePromise

      // Get all available workspaces
      const workspaceList = await persistence.workspace.getAll()
      workspaces.value = workspaceList

      if (!id) {
        return
      }

      // Load the selected workspace id
      if (await loadWorkspace(id)) {
        return
      }

      // Load the first workspace we can find when the default workspace
      if (id === DEFAULT_WORKSPACE.id) {
        if (workspaceList[0] && (await loadWorkspace(workspaceList[0].id))) {
          return
        }

        // Create the default workspace and navigate to it
        await createAndPersistWorkspace(DEFAULT_WORKSPACE)

        if (await loadWorkspace(DEFAULT_WORKSPACE.id)) {
          // Update the workspace list
          workspaces.value.push(DEFAULT_WORKSPACE)
          return
        }
        console.error('[ERROR]: something went wrong when trying to create the default workspace')
        return
      }

      // Navigate to the default workspace, when the workspace does not exist
      return setWorkspaceId(DEFAULT_WORKSPACE.id)
    },
    { immediate: true },
  )

  /**
   * Navigates to the workspace route for the given workspace ID.
   * Updates the URL to reflect the selected workspace.
   *
   * @param id - The unique identifier (slug) of the workspace to navigate to.
   */
  const setWorkspaceId = (id: string): void => {
    router.push({ name: 'workspace.environment', params: { workspaceSlug: id } })
  }

  /**
   * Creates a new workspace with the provided name.
   * - Generates a unique ID for the workspace (sluggified from the name and guaranteed unique).
   * - Adds a default blank document ("draft") to the workspace.
   * - Persists the workspace and navigates to it.
   *
   * Example usage:
   *   await createWorkspace({ name: 'My Awesome API' })
   *   // -> Navigates to /workspace/my-awesome-api (if available)
   */
  const createWorkspace = async ({ name }: { name: string }): Promise<void> => {
    const persistence = await persistencePromise

    // Generate a unique slug/id for the workspace, based on the name.
    const newWorkspaceId = await generateUniqueValue({
      defaultValue: name,
      validation: async (value) => !(await persistence.workspace.has(value)),
      maxRetries: 100,
      transformation: slugify,
    })

    // Failed to generate a unique workspace id, so we can't create the workspace.
    if (!newWorkspaceId) {
      return
    }

    // Create a new client store with the workspace ID and add a default document.
    await createAndPersistWorkspace({ id: newWorkspaceId, name })
    // Navigate to the newly created workspace.
    setWorkspaceId(newWorkspaceId)
  }

  return {
    store,
    activeWorkspace,
    workspaces,
    setWorkspaceId,
    createWorkspace,
  }
}
