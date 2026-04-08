import type { ApiClientModal, createApiClientModal } from '@scalar/api-client/v2/features/modal'
import type { ApiClientConfiguration } from '@scalar/types/api-reference'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'

let clientModalCreator: Promise<typeof createApiClientModal> | undefined
let workspaceStoreSingleton: Promise<WorkspaceStore> | undefined
let workspaceEventBusSingleton: Promise<WorkspaceEventBus> | undefined

/** Lazy load the client modal creator */
const getClientModalCreator = (): NonNullable<typeof clientModalCreator> => {
  clientModalCreator ||= import('@scalar/api-client/v2/features/modal')
    .then(({ createApiClientModal }) => createApiClientModal)
    .catch((error) => {
      clientModalCreator = undefined
      throw error
    })
  return clientModalCreator
}

/** Module-scoped singleton workspace store (lazy-loaded on first use). */
const getWorkspaceStoreSingleton = (): NonNullable<typeof workspaceStoreSingleton> => {
  workspaceStoreSingleton ??= import('@scalar/workspace-store/client')
    .then(({ createWorkspaceStore }) => createWorkspaceStore())
    .catch((error) => {
      workspaceStoreSingleton = undefined
      throw error
    })
  return workspaceStoreSingleton
}

/** Module-scoped singleton workspace event bus (lazy-loaded on first use). */
const getWorkspaceEventBusSingleton = (): NonNullable<typeof workspaceEventBusSingleton> => {
  workspaceEventBusSingleton ??= import('@scalar/workspace-store/events')
    .then(({ createWorkspaceEventBus }) => createWorkspaceEventBus())
    .catch((error) => {
      workspaceEventBusSingleton = undefined
      throw error
    })
  return workspaceEventBusSingleton
}

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
