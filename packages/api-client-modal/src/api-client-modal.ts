import { ApiClientModal } from '@/components'
import { clientRouter, useWorkspace } from '@scalar/client-app'
import type { SpecConfiguration } from '@scalar/oas-utils'
import { objectMerge } from '@scalar/oas-utils/helpers'
import { createApp, reactive } from 'vue'

import type { ClientConfiguration } from './types'

type OpenPayload =
  | { requestUid?: string }
  | { requestUid: string; exampleUid?: string }

/** Initialize Scalar API Client Modal */
export const createScalarClient = async (
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

  const { importSpecFile, importSpecFromUrl, modalState, workspaceMutators } =
    useWorkspace()

  // Import the spec if needed
  if (config.parsedSpec) {
    importSpecFile({ parsedSpec: config.parsedSpec })
  } else if (config.spec?.url) {
    importSpecFromUrl(config.spec.url)
  } else if (config.spec?.content) {
    importSpecFile({ spec: config.spec?.content })
  } else {
    console.error('You MUST provide a spec, cannot create Scalar API Client')
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
    open: (payload: OpenPayload = {}) => {
      let path = ''

      // See if we want to route to a specific request
      if (payload.requestUid) path = `/request/${payload.requestUid}`
      if ('exampleUid' in payload) path += `/example/${payload.exampleUid}`
      clientRouter.push(path)

      modalState.open = true
    },
    /** Mount the references to a given element */
    mount,
  }
}
