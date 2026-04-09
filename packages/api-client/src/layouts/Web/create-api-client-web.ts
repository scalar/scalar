import type { ApiClientConfiguration } from '@scalar/types/api-reference'
import { createRouter, createWebHistory } from 'vue-router'

import { createApiClient } from '@/libs'
import { routes, saveActiveWorkspace } from '@/routes'

import ApiClientWeb from './ApiClientWeb.vue'

/**
 * Mount the API Client to a given element.
 */
export const createApiClientWeb = async (
  /** Element to mount the references to */
  el: HTMLElement | null,
  /** Configuration object for API client */
  configuration: Partial<ApiClientConfiguration> = {},
  /**
   * Will attempt to mount the references immediately
   * For SSR this may need to be blocked and done client side
   */
  mountOnInitialize = true,
) => {
  const router = createRouter({
    history: createWebHistory(),
    routes,
  })

  const client = createApiClient({
    el,
    appComponent: ApiClientWeb,
    configuration,
    mountOnInitialize,
    router,
    layout: 'web',
  })

  const { importSpecFile, importSpecFromUrl } = client.store

  router.afterEach((to) => {
    saveActiveWorkspace(to)
  })

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
