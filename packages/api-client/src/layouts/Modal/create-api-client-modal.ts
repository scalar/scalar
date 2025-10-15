import { type Router, createMemoryHistory, createRouter } from 'vue-router'

import { type ApiClient, type CreateApiClientParams, createApiClient } from '@/libs'
import { modalRoutes } from '@/routes'

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
  }
}
