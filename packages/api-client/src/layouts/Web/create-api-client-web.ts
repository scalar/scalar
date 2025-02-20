import { type ClientConfiguration, createApiClient } from '@/libs'
import { createWebHistoryRouter, saveActiveWorkspace } from '@/router'

import ApiClientWeb from './ApiClientWeb.vue'
import type { Workspace } from '@scalar/oas-utils/entities'

/**
 * Mount the API Client to a given element.
 */
export const createApiClientWeb = async (
  /** Element to mount the references to */
  el: HTMLElement | null,
  /** Configuration object for API client */
  configuration: ClientConfiguration = {},
  /**
   * Will attempt to mount the references immediately
   * For SSR this may need to be blocked and done client side
   */
  mountOnInitialize = true,
) => {
  const router = createWebHistoryRouter()
  const client = createApiClient({
    el,
    appComponent: ApiClientWeb,
    configuration: configuration,
    mountOnInitialize,
    router,
    layout: 'web',
  })

  const { importSpecFile, importSpecFromUrl } = client.store
  router.afterEach(saveActiveWorkspace)

  // Import the spec if needed
  if (configuration.spec?.url) {
    await importSpecFromUrl(configuration.spec.url, 'default' as Workspace['uid'], {
      proxyUrl: configuration.proxyUrl,
    })
  } else if (configuration.spec?.content) {
    await importSpecFile(configuration.spec?.content, 'default' as Workspace['uid'])
  }

  return client
}
