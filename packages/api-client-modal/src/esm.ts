import { ApiClientModal } from '@/components'
import { useWorkspace } from '@scalar/client-app'
import { useModal } from '@scalar/components'
import type { SpecConfiguration } from '@scalar/oas-utils'
import { fetchSpecFromUrl, objectMerge } from '@scalar/oas-utils/helpers'
import { createApp, reactive } from 'vue'

import type { ClientConfiguration } from './types'

/** Initialize Scalar API Client Modal */
export const createScalarReferences = async (
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

  const modalState = useModal()
  const { importSpecFile } = useWorkspace()

  // Import the spec if needed
  if (config.spec.url) {
    const spec = await fetchSpecFromUrl(config.spec.url)
    importSpecFile(spec)
  } else if (config.spec.content) {
    importSpecFile(config.spec.content)
  } else {
    console.error('You MUST provide a spec')
  }

  const app = createApp(ApiClientModal, { config, modalState })

  const mount = (mountingEl = el) => {
    if (!mountingEl) {
      console.warn(
        'Invalid HTML element provided. Cannot mount Scalar References',
      )
      return
    }
    app.mount(mountingEl)
  }

  if (mountOnInitialize) mount()

  return {
    /** Update the API client config */
    updateConfig(newConfig: ClientConfiguration, mergeConfigs = true) {
      if (mergeConfigs) {
        Object.assign(config, newConfig)
      } else {
        objectMerge(config, newConfig)
      }
    },
    /** Update the spec file, this will re-parse it */
    updateSpec(spec: SpecConfiguration) {
      config.spec = spec
    },
    /** Opens the API client modal */
    open,
    /** Mount the references to a given element */
    mount,
  }
}
