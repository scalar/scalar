import { type ClientConfiguration, createApiClient } from '@/libs'
import { createWebHistoryRouter, saveWorkspace } from '@/router'

import ApiClientApp from './ApiClientApp.vue'

/**
 * Mount the full-blown API Client modal to a given element.
 */
export const createApiClientApp = async (
  /** Element to mount the references to */
  el: HTMLElement | null,
  /** Configuration object for API client */
  configuration: ClientConfiguration = {},
  /**
   * Will attempt to mount the references immediately
   * For SSR this may need to be blocked and done client side
   */
  mountOnInitialize = true,
  /** Vue router to use */
  router = createWebHistoryRouter(),
) => {
  const client = createApiClient({
    el,
    appComponent: ApiClientApp,
    configuration: configuration,
    mountOnInitialize,
    router,
    layout: 'desktop',
  })

  const { importSpecFile, importSpecFromUrl } = client.store
  router.afterEach(saveWorkspace)

  // Import the spec if needed
  if (configuration.spec?.url) {
    await importSpecFromUrl(configuration.spec.url, 'default', {
      proxy: configuration.proxyUrl,
    })
  } else if (configuration.spec?.content) {
    await importSpecFile(configuration.spec?.content, 'default')
  }

  return client
}
