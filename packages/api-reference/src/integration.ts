import { createApp, reactive } from 'vue'

import ApiReference from './components/ApiReference.vue'
import { objectMerge } from './helpers'
import type { ReferenceConfiguration, SpecConfiguration } from './types'

/** Initialize Scalar References and  */
export function ScalarReferences(
  /** Element to mount the references to */
  el: HTMLElement,
  /** Configuration object for Scalar References */
  initialConfig: ReferenceConfiguration,
  /**
   * Will attempt to mount the references immediately
   * For SSR this may need to be blocked and done client side
   */
  mountOnInitialize: true,
) {
  const config = reactive(initialConfig)

  const app = createApp(ApiReference, config)

  function mount(mountLocation = el) {
    if (!el) {
      console.warn(
        'Invalid HTML element provided. Cannot mount Scalar References',
      )
      return
    }
    app.mount(mountLocation)
  }

  if (mountOnInitialize) mount()

  return {
    /** Update the configuration for a mounted reference */
    updateConfig(newConfig: ReferenceConfiguration, mergeConfigs = true) {
      if (mergeConfigs) {
        Object.assign(config, newConfig)
      } else {
        objectMerge(config, newConfig)
      }
    },
    updateSpec(spec: SpecConfiguration) {
      config.spec = spec
    },
    /** Mount the references to a given element */
    mount,
  }
}
