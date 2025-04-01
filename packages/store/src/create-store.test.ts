/**
 * @vitest-environment jsdom
 */
import { describe, expect, it } from 'vitest'
import { nextTick, reactive, watch } from 'vue'

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
function createStore(options?: { plugins?: StorePlugin[] }): Store {
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
function localStoragePlugin(options?: { key?: string }): StorePlugin {
  const DEFAULT_LOCAL_STORAGE_KEY = 'store'
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

describe('createStore', () => {
  it('creates a store and exports the state as an OpenAPI document', () => {
    const store = createStore()

    store.actions.load('default', {
      openapi: '3.1.1',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      paths: {
        '/test': {
          get: {
            summary: 'Test endpoint',
            responses: {
              '200': {
                description: 'Test response',
              },
            },
          },
        },
      },
    })

    const result = store.actions.export('default')

    expect(result).toMatchObject({
      openapi: '3.1.1',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      paths: {
        '/test': {
          get: {
            summary: 'Test endpoint',
            responses: {
              '200': {
                description: 'Test response',
              },
            },
          },
        },
      },
    })
  })

  it('imports content asynchronously', async () => {
    const store = createStore()

    // Simulate fetching content from a remote server
    store.actions.load('default', async () => {
      await new Promise((resolve) => setTimeout(resolve, 50))

      return {
        openapi: '3.1.1',
        info: {
          title: 'Test API',
          version: '1.0.0',
        },
        paths: {},
      }
    })

    await new Promise((resolve) => setTimeout(resolve, 100))

    expect(store.state.collections.default).toMatchObject({
      openapi: '3.1.1',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      paths: {},
    })
  })

  it('persists the state to localStorage', async () => {
    const store = createStore({
      plugins: [localStoragePlugin()],
    })

    store.actions.load('default', {
      openapi: '3.1.1',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      paths: {},
    })

    // Wait for the watcher to do its thing
    await nextTick()

    // Parse the localStorage value before comparing
    const state = JSON.parse(localStorage.getItem('store') || '{}')

    expect(state).toMatchObject({
      collections: {
        default: {
          openapi: '3.1.1',
          info: {
            title: 'Test API',
            version: '1.0.0',
          },
          paths: {},
        },
      },
    })
  })

  it('restores the state from localStorage', async () => {
    localStorage.setItem(
      'store',
      JSON.stringify({
        collections: {
          default: {
            openapi: '3.1.1',
            info: {
              title: 'Test API',
              version: '1.0.0',
            },
            paths: {},
          },
        },
      }),
    )

    const store = createStore({
      plugins: [localStoragePlugin()],
    })

    expect(store.state.collections.default).toBeDefined()
    expect(store.state.collections.default).toMatchObject({
      openapi: '3.1.1',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      paths: {},
    })
  })
})
