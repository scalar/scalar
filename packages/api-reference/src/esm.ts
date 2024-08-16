import { objectMerge } from '@scalar/oas-utils/helpers'
import type {
  ReferenceConfiguration,
  SpecConfiguration,
} from '@scalar/types/legacy'
import { createHead } from '@unhead/vue'
import { createApp, reactive } from 'vue'

import ApiReference from './components/ApiReference.vue'

/** Initialize Scalar References */
export function createScalarReferences(
  /** Element to mount the references to */
  el: HTMLElement | null,
  /** Configuration object for Scalar References */
  initialConfig: ReferenceConfiguration,
  /**
   * Will attempt to mount the references immediately
   * For SSR this may need to be blocked and done client side
   */
  mountOnInitialize = true,
) {
  const configuration = reactive(initialConfig)

  const app = createApp(ApiReference, { configuration })

  const head = createHead()
  app.use(head)

  function mount(mountingEl = el) {
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
    /** Update the configuration for a mounted reference */
    updateConfig(newConfig: ReferenceConfiguration, mergeConfigs = true) {
      if (mergeConfigs) {
        Object.assign(configuration, newConfig)
      } else {
        objectMerge(configuration, newConfig)
      }
    },
    updateSpec(spec: SpecConfiguration) {
      configuration.spec = spec
    },
    /** Mount the references to a given element */
    mount,
    /** Unmount the app from an element */
    unmount: () => app.unmount(),
  }
}
