import { type CreateApiClientParams, createApiClient } from '@/libs'
import { createModalRouter } from '@/router'

import ApiClientModal from './ApiClientModal.vue'

/**
 * Initialize Scalar API Client Modal
 *
 * This async method includes importing the spec
 */
export const createApiClientModal = async ({
  el = null,
  configuration = {},
  mountOnInitialize = true,
  store,
}: Partial<Pick<CreateApiClientParams, 'el' | 'configuration' | 'mountOnInitialize' | 'store'>>) => {
  // Default sidebar to closed in the modal
  const _configuration = {
    ...configuration,
  }

  const client = createApiClient({
    el,
    appComponent: ApiClientModal,
    configuration: _configuration,
    persistData: false,
    isReadOnly: true,
    store,
    mountOnInitialize,
    router: createModalRouter(),
    layout: 'modal',
  })

  const { importSpecFile, importSpecFromUrl } = client.store

  // Import the spec if we don't pass in a store
  if (!store) {
    if (configuration.url) {
      await importSpecFromUrl(configuration.url, 'default', {
        proxyUrl: configuration.proxyUrl,
        useCollectionSecurity: true,
        ...configuration,
      })
    } else if (configuration.content) {
      await importSpecFile(configuration.content, 'default', {
        useCollectionSecurity: true,
        ...configuration,
      })
    }
  }

  return client
}

/**
 * Initialize Scalar API Client Modal Sync
 *
 * This sync method does not include the spec, just sets up an empty workspace
 */
export const createApiClientModalSync = ({
  el = null,
  configuration = {},
  mountOnInitialize = true,
  store,
}: Partial<Pick<CreateApiClientParams, 'el' | 'configuration' | 'mountOnInitialize' | 'store'>>) =>
  createApiClient({
    el,
    appComponent: ApiClientModal,
    configuration,
    persistData: false,
    isReadOnly: true,
    mountOnInitialize,
    store,
    router: createModalRouter(),
    layout: 'modal',
  })
