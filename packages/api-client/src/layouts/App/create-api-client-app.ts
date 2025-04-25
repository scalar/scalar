import { createApiClient } from '@/libs'
import { createWebHistoryRouter, saveActiveWorkspace } from '@/router'
import type { ApiClientConfiguration } from '@scalar/types/api-reference'
import ApiClientApp from './ApiClientApp.vue'

/**
 * Mount the full-blown API Client modal to a given element.
 */
export const createApiClientApp = async (
  /** Element to mount the references to */
  el: HTMLElement | null,
  /** Configuration object for API client */
  configuration: Partial<ApiClientConfiguration> = {},
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
  router.afterEach(saveActiveWorkspace)

  // Import the spec if needed
  if (configuration.url) {
    await importSpecFromUrl(configuration.url, 'default', {
      proxyUrl: configuration.proxyUrl,
    })
  } else if (configuration.content) {
    await importSpecFile(configuration.content, 'default')
  }

  return client
}
