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
}: Pick<
  CreateApiClientParams,
  'el' | 'configuration' | 'mountOnInitialize' | 'store'
>) => {
  const client = createApiClient({
    el,
    appComponent: ApiClientModal,
    configuration: configuration,
    persistData: false,
    isReadOnly: true,
    store,
    mountOnInitialize,
    router: createModalRouter(),
    layout: 'modal',
  })

  const { importSpecFile, importSpecFromUrl } = client.store

  // Import the spec if needed
  if (configuration.spec?.url)
    await importSpecFromUrl(configuration.spec.url, 'default', {
      proxyUrl: configuration.proxyUrl,
      setCollectionSecurity: true,
      ...configuration,
    })
  else if (configuration.spec?.content)
    await importSpecFile(configuration.spec?.content, 'default', {
      setCollectionSecurity: true,
      ...configuration,
    })

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
}: Pick<
  CreateApiClientParams,
  'el' | 'configuration' | 'mountOnInitialize' | 'store'
>) =>
  createApiClient({
    el,
    appComponent: ApiClientModal,
    configuration,
    persistData: false,
    isReadOnly: true,
    mountOnInitialize,
    store,
    router: createModalRouter(),
  })
