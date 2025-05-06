import { type Ref, isRef, reactive, watch } from '@vue/reactivity'
import { type Collection, createCollection } from './create-collection'

type State = {
  collections: Record<string, Collection>
}

type Workspace = {
  state: State
  plugins: WorkspacePlugin[]
  load: (
    collectionId: string,
    content:
      | Record<string, unknown>
      | (() => Promise<Record<string, unknown>>)
      | Ref<Record<string, unknown>>
      | Ref<string>,
  ) => void
  export: (collectionId: string) => Record<string, unknown>
  delete: (collectionId: string) => void
  update: (collectionId: string, newDocument: Record<string, unknown>) => void
  merge: (collectionId: string, partialDocument: Record<string, unknown>) => void
  apply: (collectionId: string, overlay: Record<string, unknown> | Record<string, unknown>[]) => void
}

type WorkspacePlugin = {
  onBeforeLoad: (workspace: Workspace) => Record<string, unknown> | undefined
  onBeforeSave: (workspace: Workspace) => void
}

// Create a new Collection
export function createWorkspace(options?: { plugins?: WorkspacePlugin[] }): Workspace {
  const workspace = {
    state: reactive({
      collections: {},
    }),
    plugins: options?.plugins ?? [],
    async load(
      collectionId: string,
      contentOrAsyncCallback:
        | Record<string, unknown>
        | (() => Promise<Record<string, unknown>>)
        | Ref<Record<string, unknown>>
        | Ref<string>,
    ) {
      const content =
        typeof contentOrAsyncCallback === 'function' ? await contentOrAsyncCallback() : contentOrAsyncCallback

      // TODO: Validate content

      if (typeof workspace.state.collections[collectionId] === 'undefined') {
        workspace.state.collections[collectionId] = createCollection(content)

        // If content is a Ref, watch for changes and reload the collection
        if (isRef(content)) {
          watch(
            content,
            () => {
              workspace.state.collections[collectionId] = createCollection(content)
            },
            { deep: true },
          )
        }
      } else {
        // If content is a Ref, pass it directly to createCollection
        // Otherwise wrap the content in an object assignment
        if (isRef(content)) {
          workspace.state.collections[collectionId] = createCollection(content)
        } else {
          Object.assign(workspace.state.collections[collectionId], content)
        }
      }
    },
    delete(collectionId: string) {
      delete workspace.state.collections[collectionId]
    },
    export(collectionId: string) {
      return workspace.state.collections[collectionId]?.export()
    },
    update(collectionId: string, newDocument: Record<string, unknown>) {
      const collection = workspace.state.collections[collectionId]
      if (collection && typeof collection.update === 'function') {
        collection.update(newDocument)
      }
    },
    merge(collectionId: string, partialDocument: Record<string, unknown>) {
      const collection = workspace.state.collections[collectionId]
      if (collection && typeof collection.merge === 'function') {
        collection.merge(partialDocument)
      }
    },
    apply(collectionId: string, overlay: Record<string, unknown> | Record<string, unknown>[]) {
      const collection = workspace.state.collections[collectionId]
      if (collection && typeof collection.apply === 'function') {
        collection.apply(overlay)
      }
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

/**
 * Local Storage Persistence Plugin
 *
 * TODO: Make this work with async hooks (We’ll need this to support IndexDB).
 */
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
        if (state && typeof state === 'object' && 'collections' in state) {
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
