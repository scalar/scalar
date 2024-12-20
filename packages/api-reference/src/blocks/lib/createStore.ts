import { createWorkspaceStore } from '@scalar/api-client/store'
import { workspaceSchema } from '@scalar/oas-utils/entities'
import type { ThemeId } from '@scalar/themes'

export type CreateStoreOptions = (
  | { url: string; content?: never }
  | { content: string; url?: never }
  | { url?: never; content?: never }
) & {
  theme?: ThemeId
  proxyUrl?: string
}

// TODO: Shouldn’t this be exposed by @scalar/api-client?
export type StoreContext = ReturnType<typeof createWorkspaceStore>

/**
 * TODO: Write comment
 */
export type StoreReturn = {
  store: StoreContext
  addUrl: (url: string) => void
  addContent: (content: string) => void
  addCollection: ({ url, name }: { url: string; name: string }) => void
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
    proxyUrl: options.proxyUrl ?? 'https://proxy.scalar.com',
    // TODO: I don’t know why this exists, we need to pass the theme to workspaceSchema.parse anyway
    themeId: options.theme ?? 'default',
    // TODO: Make everything configurable
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
    proxyUrl: options.proxyUrl ?? 'https://proxy.scalar.com',
    themeId: options.theme ?? 'default',
  })

  store.workspaceMutators.rawAdd(workspace)

  /**
   * Add an API definition URL to the store
   */
  const addUrl = (url: string, name?: string) => {
    store.importSpecFromUrl(url, 'default', {
      shouldLoad: true,
      setCollectionSecurity: true,
      proxyUrl: options.proxyUrl ?? 'https://proxy.scalar.com',
      name: name ?? 'default',
    })
  }

  /**
   * Add an API definition to the store
   */
  const addContent = (content: string, name?: string) => {
    store.importSpecFile(content, 'default', {
      shouldLoad: true,
      setCollectionSecurity: true,
      name: name ?? 'default',
    })
  }

  const addCollection = ({ url, name }: { url: string; name: string }) => {
    // TODO: Add support for content?
    if (url) {
      addUrl(url, name)
    }
  }

  // If an API definition URL is provided, add it to the store
  if (options.url) {
    addUrl(options.url)
  }

  // If an API definition content is provided, add it to the store
  if (options.content) {
    addContent(options.content)
  }

  return {
    store,
    addUrl,
    addContent,
    addCollection,
  }
}
