import { appRouter } from '@/router'
import { useWorkspace } from '@/store/workspace'
import type { SpecConfiguration } from '@scalar/oas-utils'
import { type RequestMethod, objectMerge } from '@scalar/oas-utils/helpers'
import type { ThemeId } from '@scalar/themes'
import { createApp } from 'vue'

import ApiClientEmbed from './ApiClientEmbed.vue'

/** Configuration options for the Scalar API client */
export type ClientConfiguration = {
  /** The Swagger/OpenAPI spec to render */
  spec: SpecConfiguration
  /** Pass in a proxy to the API client */
  proxyUrl?: string
  /** Pass in a theme API client */
  themeId?: ThemeId
  /** Whether to show the sidebar */
  showSidebar?: boolean
  /** Whether dark mode is on or off initially (light mode) */
  // darkMode?: boolean
  /** Key used with CTRL/CMD to open the search modal (defaults to 'k' e.g. CMD+k) */
  searchHotKey?:
    | 'a'
    | 'b'
    | 'c'
    | 'd'
    | 'e'
    | 'f'
    | 'g'
    | 'h'
    | 'i'
    | 'j'
    | 'k'
    | 'l'
    | 'm'
    | 'n'
    | 'o'
    | 'p'
    | 'q'
    | 'r'
    | 's'
    | 't'
    | 'u'
    | 'v'
    | 'w'
    | 'x'
    | 'y'
    | 'z'
}

export type OpenClientPayload = { path: string; method: RequestMethod }

/** Initialize Scalar API Client embed */
export const createApiClientEmbed = async (
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
    requests,
    workspaceMutators,
  } = useWorkspace()

  // Import the spec if needed
  if (config.spec?.url) {
    await importSpecFromUrl(config.spec.url, config.proxyUrl)
  } else if (config.spec?.content) {
    await importSpecFile(config.spec?.content)
  } else {
    console.error(
      `[createApiClientEmbed] Could not create the API client.`,
      `Please provide an OpenAPI document: { spec: { url: '…' } }`,
      `Read more: https://github.com/scalar/scalar/tree/main/packages/api-client-modal`,
    )
  }

  const app = createApp(ApiClientEmbed)
  app.use(appRouter)

  const mount = (mountingEl = el) => {
    if (!mountingEl) {
      console.error(
        `[createApiClientEmbed] Could not create the API client.`,
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
          `[createApiClientEmbed] Could not create the API client.`,
          `Please provide an OpenAPI document: { spec: { url: '…' } }`,
          `Read more: https://github.com/scalar/scalar/tree/main/packages/api-client-modal`,
        )
      }
    },
    /** Open the  API client modal */
    open: (payload?: OpenClientPayload) => {
      // Find the request from path + method
      const request = Object.values(requests).find(({ path, method }) =>
        payload
          ? // The given operation
            path === payload.path && method === payload.method
          : // Or the first request
            true,
      )
      if (request) appRouter.push(`/request/${request.uid}`)
    },
    /** Mount the references to a given element */
    mount,
  }
}
