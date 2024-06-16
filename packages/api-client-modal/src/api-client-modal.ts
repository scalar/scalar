import { ApiClientModal } from '@/components'
import type { ClientConfiguration, OpenClientPayload } from '@/types'
import { clientRouter, useWorkspace } from '@scalar/client-app'
import type { SpecConfiguration } from '@scalar/oas-utils'
import { objectMerge } from '@scalar/oas-utils/helpers'
import { createApp, reactive } from 'vue'

/** Initialize Scalar API Client Modal */
export const createScalarApiClient = async (
  /** Element to mount the references to */
  el: HTMLElement | null,
  /** Configuration object for Scalar References */
  initialConfig: ClientConfiguration,
  /**
   * Will attempt to mount the references immediately
   * For SSR this may need to be blocked and done client side
   */
  mountOnInitialize = true,
) => {
  const config = reactive(initialConfig)

  const {
    importSpecFile,
    requests,
    importSpecFromUrl,
    modalState,
    workspaceMutators,
  } = useWorkspace()

  // Import the spec if needed
  if (config.spec?.url) {
    importSpecFromUrl(config.spec.url, config.proxyUrl)
  } else if (config.spec?.content) {
    importSpecFile(config.spec?.content)
  } else {
    console.error(
      `[@scalar/api-client-modal] Could not create the API client.`,
      `Please provide an OpenAPI document: { spec: { url: '…' } }`,
      `Read more: https://github.com/scalar/scalar/tree/main/packages/api-client-modal`,
    )
  }

  const app = createApp(ApiClientModal, { config, modalState })
  app.use(clientRouter)

  const mount = (mountingEl = el) => {
    if (!mountingEl) {
      console.error(
        `[@scalar/api-client-modal] Could not create the API client.`,
        `Invalid HTML element provided.`,
        `Read more: https://github.com/scalar/scalar/tree/main/packages/api-client-modal`,
      )

      return
    }
    app.mount(mountingEl)
  }

  if (mountOnInitialize) mount()
  workspaceMutators.edit('isReadOnly', true)

  return {
    /** Update the API client config */
    updateConfig(newConfig: ClientConfiguration, mergeConfigs = true) {
      if (mergeConfigs) {
        Object.assign(config, newConfig)
      } else {
        objectMerge(config, newConfig)
      }
      if (newConfig.spec) importSpecFile(newConfig.spec)
    },
    /** Update the spec file, this will re-parse it */
    updateSpec(spec: SpecConfiguration) {
      importSpecFile(spec)
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

      if (request) {
        clientRouter.push(`/request/${request.uid}`)
      }

      modalState.open = true
    },
    /** Mount the references to a given element */
    mount,
    modalState,
  }
}
