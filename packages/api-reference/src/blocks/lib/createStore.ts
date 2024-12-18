import { createWorkspaceStore } from '@scalar/api-client/store'
import { workspaceSchema } from '@scalar/oas-utils/entities'

export type CreateStoreOptions = {
  url: string
}

// TODO: Shouldn’t this be exposed by @scalar/api-client?
export type StoreContext = ReturnType<typeof createWorkspaceStore>

/**
 * TODO: Write comment
 */
export type StoreReturn = {
  store: StoreContext
  add: (url: string) => void
}

/**
 * Creates a store context holding the API definition(s)
 *
 * @example
 * createStore({
 *   url: 'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.json'
 * })
 */
export function createStore(options: CreateStoreOptions): StoreReturn {
  // Create the store
  const store = createWorkspaceStore({
    isReadOnly: true,
    // TODO: Make this configurable
    proxyUrl: 'https://proxy.scalar.com',
    themeId: 'kepler',
    useLocalStorage: false,
    hideClientButton: false,
  })

  // Create an empty workspace in the store
  // store.workspaceMutators.add({
  //   uid: 'default',
  //   name: 'Workspace',
  //   proxyUrl: 'https://proxy.scalar.com',
  // })

  const workspace = workspaceSchema.parse({
    uid: 'default',
    name: 'Workspace',
    isReadOnly: true,
    proxyUrl: 'https://proxy.scalar.com',
  })

  store.workspaceMutators.rawAdd(workspace)

  /**
   * Add an API definition to the store
   */
  const add = (url: string) => {
    store.importSpecFromUrl(url, 'default', {
      shouldLoad: true,
      setCollectionSecurity: true,
      proxyUrl: 'https://proxy.scalar.com',
    })
  }

  // If an API definition URL is provided, add it to the store
  if (options.url) {
    add(options.url)
  }

  return {
    store,
    add,
  }
}
