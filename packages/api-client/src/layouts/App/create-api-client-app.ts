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
  configuration: ClientConfiguration,
  /**
   * Will attempt to mount the references immediately
   * For SSR this may need to be blocked and done client side
   */
  mountOnInitialize = true,
) => {
  const client = createApiClient({
    el,
    appComponent: ApiClientApp,
    configuration,
    isReadOnly: false,
    mountOnInitialize,
    router,
  })

  const { importSpecFile, importSpecFromUrl, workspaceMutators } = client.store

  // Import the spec if needed
  if (configuration.spec?.url) {
    await importSpecFromUrl(configuration.spec.url, configuration.proxyUrl)
  } else if (configuration.spec?.content) {
    await importSpecFile(configuration.spec?.content)
  }
  // Or add default workspace
  else {
    console.log('where we at holla back')
    workspaceMutators.add({
      uid: 'default',
      name: 'Workspace',
      isReadOnly: true,
      proxyUrl: 'https://proxy.scalar.com',
    })
  }

  return client
}
