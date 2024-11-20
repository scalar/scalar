import { type ClientConfiguration, createApiClient } from '@/libs'
import { createModalRouter } from '@/router'

import ApiClientModal from './ApiClientModal.vue'

/**
 * Initialize Scalar API Client Modal
 *
 * This async method includes importing the spec
 */
export const createApiClientModal = async (
  /** Element to mount the references to */
  el: HTMLElement | null,
  /** Configuration object for the API client */
  configuration: ClientConfiguration = {},
  /**
   * Will attempt to mount the references immediately
   * For SSR this may need to be blocked and done client side
   */
  mountOnInitialize = true,
) => {
  const client = createApiClient({
    el,
    appComponent: ApiClientModal,
    configuration: configuration,
    persistData: false,
    isReadOnly: true,
    mountOnInitialize,
    router: createModalRouter(),
    layout: 'modal',
  })

  const { importSpecFile, importSpecFromUrl } = client.store

  // Import the API definition
  try {
    if (configuration.spec?.url) {
      await importSpecFromUrl(configuration.spec.url, 'default', {
        proxy: configuration.proxyUrl,
        setCollectionSecurity: true,
        ...configuration,
      })
    } else if (configuration.spec?.content) {
      await importSpecFile(configuration.spec?.content, 'default', {
        setCollectionSecurity: true,
        ...configuration,
      })
    }
  } catch (error) {
    console.error(
      '[createApiClientModal] Failed to import the OpenAPI document.',
    )
    console.error(error)
  }

  return client
}

/**
 * Initialize Scalar API Client Modal Sync
 *
 * This sync method does not include the spec, just sets up an empty workspace
 */
export const createApiClientModalSync = (
  /** Element to mount the references to */
  el: HTMLElement | null,
  /** Configuration object for API client */
  configuration: ClientConfiguration = {},
  /**
   * Will attempt to mount the references immediately
   * For SSR this may need to be blocked and done client side
   */
  mountOnInitialize = true,
) =>
  createApiClient({
    el,
    appComponent: ApiClientModal,
    configuration,
    persistData: false,
    isReadOnly: true,
    mountOnInitialize,
    router: createModalRouter(),
  })
