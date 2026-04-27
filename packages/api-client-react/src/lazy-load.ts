import type { ApiClientOptions } from '@scalar/api-client/modal'

/**
 * Creates a lazy singleton getter: the factory runs at most once, caches the resulting promise,
 * and clears the cache on failure so the next call can retry.
 *
 * Optional args are forwarded to the factory on the first (cache-miss) call only.
 * Subsequent calls return the cached promise regardless of the args passed.
 */
const makeLazySingleton = <T, Args extends unknown[] = []>(
  factory: (...args: Args) => Promise<T>,
): ((...args: Args) => Promise<T>) => {
  let cached: Promise<T> | undefined
  return (...args: Args) => {
    cached ??= factory(...args).catch((error) => {
      cached = undefined
      throw error
    })
    return cached
  }
}

/** Lazy load the client modal creator */
export const getClientModalCreator = makeLazySingleton(() =>
  import('@scalar/api-client/modal').then(({ createApiClientModal }) => createApiClientModal),
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
 * Lazily creates the singleton Vue app, mounts it as the last child of document.body,
 * and returns the controller. Subsequent calls return the same promise.
 *
 * Only modal-supported options are accepted here. Document-specific fields
 * (`url`, `content`) must be registered via `workspaceStore.addDocument` after the client
 * is ready — they are not part of the modal constructor.
 */
export const getOrCreateApiClient = makeLazySingleton(async (options: ApiClientOptions = {}) => {
  const el = document.createElement('div')
  el.className = 'scalar-app'
  document.body.appendChild(el)

  try {
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
  } catch (error) {
    el.remove()
    throw error
  }
})
