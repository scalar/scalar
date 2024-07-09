import type { ClientConfiguration } from '@/Modal'
import { appRouter } from '@/router'
import { useWorkspace } from '@/store/workspace'
import type { SpecConfiguration } from '@scalar/oas-utils'
import { type RequestMethod, objectMerge } from '@scalar/oas-utils/helpers'
import { createApp } from 'vue'

import ApiClientApp from './ApiClientApp.vue'

export type OpenClientPayload = { path: string; method: RequestMethod }

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
  const {
    activeWorkspace,
    importSpecFile,
    importSpecFromUrl,
    workspaceMutators,
  } = useWorkspace()

  // Import the spec if needed
  if (config.spec?.url) {
    await importSpecFromUrl(config.spec.url, config.proxyUrl)
  } else if (config.spec?.content) {
    await importSpecFile(config.spec?.content)
  } else {
    console.error(
      `[createApiClientApp] Could not create the API client.`,
      `Please provide an OpenAPI document: { spec: { url: '…' } }`,
      `Read more: https://github.com/scalar/scalar/tree/main/packages/api-client-modal`,
    )
  }

  const app = createApp(ApiClientApp)
  app.use(appRouter)

  const mount = (mountingEl = el) => {
    if (!mountingEl) {
      console.error(
        `[createApiClientApp] Could not create the API client.`,
        `Invalid HTML element provided.`,
        `Read more: https://github.com/scalar/scalar/tree/main/packages/api-client-modal`,
      )

      return
    }
    app.mount(mountingEl)
  }

  if (activeWorkspace.value) {
    if (mountOnInitialize) mount()

    if (config.proxyUrl) {
      workspaceMutators.edit(
        activeWorkspace.value.uid,
        'proxyUrl',
        config.proxyUrl,
      )
    }

    if (config.themeId) {
      workspaceMutators.edit(
        activeWorkspace.value.uid,
        'themeId',
        config.themeId,
      )
    }
  }

  return {
    /** The vue app instance for the modal, be careful with this */
    app,
    /** Update the API client config */
    updateConfig(newConfig: ClientConfiguration, mergeConfigs = true) {
      if (mergeConfigs) {
        Object.assign(config, newConfig)
      } else {
        objectMerge(config, newConfig)
      }
      if (newConfig.spec) importSpecFile(newConfig.spec)
    },
    /** Update the spec file, this will re-parse it and clear your store */
    updateSpec: (spec: SpecConfiguration) => {
      if (spec?.url) {
        importSpecFromUrl(spec.url, config.proxyUrl)
      } else if (spec?.content) {
        importSpecFile(spec?.content)
      } else {
        console.error(
          `[createApiClientApp] Could not create the API client.`,
          `Please provide an OpenAPI document: { spec: { url: '…' } }`,
          `Read more: https://github.com/scalar/scalar/tree/main/packages/api-client-modal`,
        )
      }
    },
    /** Mount the references to a given element */
    mount,
  }
}
