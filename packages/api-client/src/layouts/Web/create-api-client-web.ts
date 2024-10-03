import { type ClientConfiguration, createApiClient } from '@/libs'
import { router as _router, saveWorkspace } from '@/router'

import ApiClientWeb from './ApiClientWeb.vue'

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
  /** Vue router to use */
  router = _router,
) => {
  const client = createApiClient({
    el,
    appComponent: ApiClientWeb,
    configuration: configuration,
    mountOnInitialize,
    router,
  })

  const { importSpecFile, importSpecFromUrl } = client.store
  router.afterEach(saveWorkspace)

  // Import the spec if needed
  if (configuration.spec?.url) {
    await importSpecFromUrl(configuration.spec.url, configuration.proxyUrl)
  } else if (configuration.spec?.content) {
    await importSpecFile(configuration.spec?.content)
  }

  return client
}
