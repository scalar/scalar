import type { ApiClientModal } from '@scalar/api-client/v2/features/modal'
import type { ApiClientConfiguration } from '@scalar/types/api-reference'
import type { WorkspaceStore } from '@scalar/workspace-store/client'

/**
 * Creates a lazy singleton getter: the factory runs at most once, caches the resulting promise,
 * and clears the cache on failure so the next call can retry.
 */
const makeLazySingleton = <T>(factory: () => Promise<T>): (() => Promise<T>) => {
  let cached: Promise<T> | undefined
  return () => {
    cached ??= factory().catch((error) => {
      cached = undefined
      throw error
    })
    return cached
  }
}

/** Lazy load the client modal creator */
export const getClientModalCreator = makeLazySingleton(() =>
  import('@scalar/api-client/v2/features/modal').then(({ createApiClientModal }) => createApiClientModal),
)

/** Module-scoped singleton workspace store (lazy-loaded on first use). */
export const getWorkspaceStoreSingleton = makeLazySingleton(() =>
  import('@scalar/workspace-store/client').then(({ createWorkspaceStore }) => createWorkspaceStore()),
)

/** Module-scoped singleton workspace event bus (lazy-loaded on first use). */
export const getWorkspaceEventBusSingleton = makeLazySingleton(() =>
  import('@scalar/workspace-store/events').then(({ createWorkspaceEventBus }) => createWorkspaceEventBus()),
)

/**
 * Lazy-loads modal + workspace singletons, mounts the API client modal, and returns both handles.
 * Reuses the same module-scoped promises as the individual getters.
 */
export const createLazyApiClientModal = async ({
  el,
  options = {},
}: {
  el: HTMLElement
  options?: Partial<ApiClientConfiguration>
}): Promise<{ apiClient: ApiClientModal; workspaceStore: WorkspaceStore }> => {
  const [createModal, workspaceStore, eventBus] = await Promise.all([
    getClientModalCreator(),
    getWorkspaceStoreSingleton(),
    getWorkspaceEventBusSingleton(),
  ])

  const apiClient = createModal({
    el,
    eventBus,
    workspaceStore,
    options,
    // TODO: map plugins from configuration when available
    // plugins: mapConfigPlugins(options),
  })

  return { apiClient, workspaceStore }
}
