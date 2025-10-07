import { type Router, createMemoryHistory, createRouter } from 'vue-router'

import { type ApiClient, type CreateApiClientParams, createApiClient } from '@/libs'
import { modalRoutes } from '@/routes'
import type { WorkspaceStore } from '@/store'

import ApiClientModal from './ApiClientModal.vue'

/**
 * Initialize Scalar API Client Modal Sync
 *
 * This sync method does not include the spec, just sets up an empty workspace
 */
export const createApiClientModal = ({
  el = null,
  configuration = {},
  mountOnInitialize = true,
  store,
}: Partial<Pick<CreateApiClientParams, 'el' | 'configuration' | 'mountOnInitialize' | 'store'>>): {
  client: ApiClient
  router: Router
  importFromUrl: (url: string) => ReturnType<WorkspaceStore['importSpecFromUrl']>
  importFromFile: (file: File) => ReturnType<WorkspaceStore['importSpecFile']>
} => {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: modalRoutes,
  })

  const client = createApiClient({
    el,
    appComponent: ApiClientModal,
    configuration,
    persistData: false,
    isReadOnly: true,
    mountOnInitialize,
    store,
    router,
    layout: 'modal',
  })

  return {
    client,
    router,
    importFromUrl: (url: string) => {
      return client.store.importSpecFromUrl(url, 'default', {
        proxyUrl: configuration.proxyUrl,
        useCollectionSecurity: true,
        ...configuration,
      })
    },
    importFromFile: (file: File) => {
      return client.store.importSpecFile(file, 'default', {
        useCollectionSecurity: true,
        ...configuration,
      })
    },
  }
}
