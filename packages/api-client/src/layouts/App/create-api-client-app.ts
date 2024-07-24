import { type ClientConfiguration, createApiClient } from '@/libs'
import { router } from '@/router'

import ApiClientApp from './ApiClientApp.vue'

/**
 * Mount the full-blown API Client modal to a given element.
 */
export const createApiClientApp = async (
  /** Element to mount the references to */
  el: HTMLElement | null,
  /** Configuration object for Scalar References */
  config: ClientConfiguration,
  /**
   * Will attempt to mount the references immediately
   * For SSR this may need to be blocked and done client side
   */
  mountOnInitialize = true,
) => {
  const client = createApiClient({
    el,
    appComponent: ApiClientApp,
    config,
    mountOnInitialize,
    router,
  })

  const { importSpecFile, importSpecFromUrl, workspaceMutators } = client.store

  console.log(client.store)

  // Import the spec if needed
  if (config.spec?.url) {
    await importSpecFromUrl(config.spec.url, config.proxyUrl)
  } else if (config.spec?.content) {
    await importSpecFile(config.spec?.content)
  }
  // Or add default workspace
  else {
    workspaceMutators.add({
      uid: 'default',
      name: 'Workspace',
      isReadOnly: true,
      proxyUrl: 'https://proxy.scalar.com',
    })
  }

  return client
}
