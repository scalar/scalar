import { reactive, watch } from '@vue/reactivity'
import { type Store, createStore } from './create-store.ts'

type State = {
  stores: Record<string, Store>
}

type Workspace = {
  state: State
  plugins: WorkspacePlugin[]
  load: (collectionId: string, content: Record<string, unknown> | (() => Promise<Record<string, unknown>>)) => void
  export: (collectionId: string) => Record<string, unknown>
}

type WorkspacePlugin = {
  onBeforeLoad: (workspace: Workspace) => Record<string, unknown> | undefined
  onBeforeSave: (workspace: Workspace) => void
}

// Create a new Store
export function createWorkspace(options?: { plugins?: WorkspacePlugin[] }): Workspace {
  const workspace = {
    state: reactive({
      stores: {},
    }),
    plugins: options?.plugins ?? [],
    async load(
      collectionId: string,
      contentOrAsyncCallback: Record<string, unknown> | (() => Promise<Record<string, unknown>>),
    ) {
      const content =
        typeof contentOrAsyncCallback === 'function' ? await contentOrAsyncCallback() : contentOrAsyncCallback

      // TODO: Validate content

      if (typeof workspace.state.stores[collectionId] === 'undefined') {
        workspace.state.stores[collectionId] = createStore(content)
      }

      Object.assign(workspace.state.stores[collectionId], content)
    },
    export(collectionId: string) {
      return workspace.state.stores[collectionId]?.export()
    },
  } as Workspace

  // Restore state with plugins
  workspace.plugins.forEach((plugin) => {
    if (plugin.onBeforeLoad) {
      const newState = plugin.onBeforeLoad(workspace)

      if (newState) {
        Object.assign(workspace.state, newState)
      }
    }
  })

  // Watch the state for changes
  watch(
    workspace.state,
    () => {
      workspace.plugins.forEach((plugin) => {
        if (plugin.onBeforeSave) {
          plugin.onBeforeSave(workspace)
        }
      })
    },
    { deep: true, immediate: true },
  )

  return workspace
}

// Persistence plugin
export function localStoragePlugin(options?: { key?: string }): WorkspacePlugin {
  const DEFAULT_LOCAL_STORAGE_KEY = 'state'
  const key = options?.key || DEFAULT_LOCAL_STORAGE_KEY

  return {
    onBeforeLoad() {
      try {
        const json = localStorage.getItem(key)

        if (!json) {
          return {
            undefined,
          }
        }

        const state = JSON.parse(json)

        // Check whether the state looks valid
        if (state && typeof state === 'object' && 'stores' in state) {
          return state as State
        }

        return undefined
      } catch (error) {
        console.error('Failed to load store from localStorage', error)

        return undefined
      }
    },
    onBeforeSave(store) {
      try {
        localStorage.setItem(key, JSON.stringify(store.state))
      } catch (error) {
        console.error('Failed to save store to localStorage', error)
      }
    },
  }
}
