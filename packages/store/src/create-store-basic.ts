import { reactive, watch } from 'vue'

type State = {
  collections: Record<string, Collection>
}

// TODO: type from the Zod schema
type Collection = Record<string, unknown>

type Store = {
  state: State
  plugins: StorePlugin[]
  actions: {
    load: (collectionId: string, content: Record<string, unknown> | (() => Promise<Record<string, unknown>>)) => void
    export: (collectionId: string) => Record<string, unknown>
  }
  getters: Record<string, () => unknown>
}

type StorePlugin = {
  onBeforeLoad: (store: Store) => Record<string, unknown> | undefined
  onBeforeSave: (store: Store) => void
}

// Create a new Store
export function createStore(options?: { plugins?: StorePlugin[] }): Store {
  const store = {
    state: reactive({
      collections: {},
    }),
    plugins: options?.plugins ?? [],
    actions: {
      async load(
        collectionId: string,
        contentOrAsyncCallback: Record<string, unknown> | (() => Promise<Record<string, unknown>>),
      ) {
        const content =
          typeof contentOrAsyncCallback === 'function' ? await contentOrAsyncCallback() : contentOrAsyncCallback

        // TODO: Validate content

        if (typeof store.state.collections[collectionId] === 'undefined') {
          store.state.collections[collectionId] = {}
        }

        Object.assign(store.state.collections[collectionId], content)
      },
      export(collectionId: string) {
        return store.state.collections[collectionId]
      },
    },
    getters: {},
  } as Store

  // Restore state with plugins
  store.plugins.forEach((plugin) => {
    if (plugin.onBeforeLoad) {
      const newState = plugin.onBeforeLoad(store)

      if (newState) {
        Object.assign(store.state, newState)
      }
    }
  })

  // Watch the state for changes
  watch(
    store.state,
    () => {
      store.plugins.forEach((plugin) => {
        if (plugin.onBeforeSave) {
          plugin.onBeforeSave(store)
        }
      })
    },
    { deep: true, immediate: true },
  )

  return store
}

// Persistence plugin
export function localStoragePlugin(options?: { key?: string }): StorePlugin {
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
