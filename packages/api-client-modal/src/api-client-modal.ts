import { ApiClientModal } from '@/components'
import type { ClientConfiguration, OpenClientPayload } from '@/types'
import { clientRouter, useWorkspace } from '@scalar/client-app'
import type { SpecConfiguration } from '@scalar/oas-utils'
import { objectMerge } from '@scalar/oas-utils/helpers'
import { createApp, reactive } from 'vue'

/** Initialize Scalar API Client Modal */
export const createScalarApiClient = async (
  /** Element to mount the references to */
  el: HTMLElement,
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
  if (config.parsedSpec) {
    importSpecFile({ parsedSpec: config.parsedSpec })
  } else if (config.spec?.url) {
    importSpecFromUrl(config.spec.url)
  } else if (config.spec?.content) {
    importSpecFile({ spec: config.spec?.content })
  } else {
    console.error(
      `[@scalar/api-client-modal] Could not create the API client.`,
      `Please provide an OpenAPI document: { spec: { url: '…' } }`,
      `Read more: https://github.com/scalar/scalar/tree/main/packages/api-client-modal1111`,
    )

    return null
  }

  const app = createApp(ApiClientModal, { config, modalState })
  app.use(clientRouter)

  const mount = (mountingEl = el) => {
    if (!mountingEl) {
      console.warn(
        'Invalid HTML element provided. Cannot mount Scalar API Client',
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
      if (newConfig.spec) importSpecFile({ spec: newConfig.spec })
    },
    /** Update the spec file, this will re-parse it */
    updateSpec(spec: SpecConfiguration) {
      importSpecFile({ spec })
    },
    /** Open the  API client modal */
    open: (payload: OpenClientPayload) => {
      // Find the request from path + method
      const request = Object.values(requests).find(
        ({ path, method }) =>
          path === payload.path && method === payload.method,
      )
      if (request) clientRouter.push(`/request/${request.uid}`)

      modalState.open = true
    },
    /** Mount the references to a given element */
    mount,
  }
}
