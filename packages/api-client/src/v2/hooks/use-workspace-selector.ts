import { type WorkspaceStore, createWorkspaceStore } from '@scalar/workspace-store/client'
import { createWorkspaceStorePersistence } from '@scalar/workspace-store/persistence'
import { persistencePlugin } from '@scalar/workspace-store/plugins/client'
import type { OpenApiDocument } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { type MaybeRefOrGetter, ref, toValue, watch } from 'vue'
import { useRouter } from 'vue-router'

const DEFAULT_WORKSPACE = {
  name: 'Default',
  id: 'default',
}
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

export const useWorkspaceSelector = ({ workspaceId }: { workspaceId: MaybeRefOrGetter<string | undefined> }) => {
  const activeWorkspace = ref<Workspace | null>(null)
  const workspaces = ref<Workspace[]>([])
  const store = ref<WorkspaceStore | null>(null)
  const persistencePromise = createWorkspaceStorePersistence()

  const router = useRouter()

  const loadWorkspace = async (workspaceId: string) => {
    const persistence = await persistencePromise
    // There is a workspace
    const workspace = await persistence.workspace.getItem(workspaceId)

    if (!workspace) {
      return false
    }

    const client = await createClientStore({ workspaceId })
    client.loadWorkspace(workspace.workspace)
    activeWorkspace.value = workspace
    // Setting the store value
    store.value = client
    return true
  }

  watch(
    () => toValue(workspaceId),
    async (newWorkspaceId) => {
      const id = toValue(newWorkspaceId)
      const persistence = await persistencePromise

      // Get all available workspaces
      console.log('getting all available workspaces')
      const workspaceList = await persistence.workspace.getAll()
      workspaces.value = workspaceList

      if (!id) {
        return
      }

      // Load the selected workspace id
      if (await loadWorkspace(id)) {
        return true
      }

      // Load the first workspace we can find when the default workspace
      if (id === DEFAULT_WORKSPACE.id) {
        if (workspaceList[0] && (await loadWorkspace(workspaceList[0].id))) {
          return
        }

        // create the default workspace
        const draftStore = createWorkspaceStore()
        await draftStore.addDocument({
          name: 'draft',
          document: defaultDocument,
        })
        const draftWorkspace = draftStore.exportWorkspace()
        // Create and navigate to the default workspace
        await persistence.workspace.setItem(DEFAULT_WORKSPACE.id, {
          name: 'Default',
          workspace: draftWorkspace,
        })

        if (await loadWorkspace(DEFAULT_WORKSPACE.id)) {
          // Update the workspace list
          workspaceList.push(DEFAULT_WORKSPACE)
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

  const setWorkspaceId = (workspaceId: string) => {
    router.push({ name: 'workspace', params: { workspaceSlug: workspaceId } })
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
    setWorkspaceId(name)
  }

  return {
    store,
    activeWorkspace,
    workspaces,
    setWorkspaceId,
    createWorkspace,
  }
}
