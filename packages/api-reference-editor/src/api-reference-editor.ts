import ApiReferenceEditor from '@/components/ApiReferenceEditor.vue'
import { UPDATE_EVENT } from '@/constants'
import type { ReferenceProps } from '@scalar/api-reference'
import { objectMerge } from '@scalar/oas-utils/helpers'
import type { ApiReferenceConfigurationSchema } from '@scalar/types/api-reference'
import { createApp, h, reactive } from 'vue'

/** Attach the Editable API Reference to the DOM */
export function mountApiReferenceEditable(
  /** Element to mount the references to */
  elementOrSelector: string | HTMLElement | null,
  /** Base configuration */
  configuration: ReferenceProps['configuration'] & {
    useExternalState?: boolean
  } = {},
  /** Optional event handler to trigger when the editor input changes */
  onUpdate?: (v: string) => void,
) {
  // Reactive props that can be set
  const props = reactive({ configuration })

  // We use a render wrapper to enable reactive props on root
  const app = createApp({
    render: () => h(ApiReferenceEditor, props),
  })

  // If an event handler is provided we capture the event.

  function mount(el: string | HTMLElement) {
    const mountEl = typeof el === 'string' ? document.querySelector(el) : el

    if (!mountEl) {
      console.error('INVALID HTML ELEMENT PROVIDED: Can not mount Scalar API References')
    } else {
      app.mount(mountEl)

      if (onUpdate) {
        mountEl.addEventListener(UPDATE_EVENT, (evt) => {
          const event = evt as CustomEvent<{ value: string }>
          onUpdate(event?.detail?.value || '')
        })
      }
    }
  }

  // Attempt to mount if an element is provided
  if (elementOrSelector) {
    const el = typeof elementOrSelector === 'string' ? document.querySelector(elementOrSelector) : elementOrSelector
    if (el) mount(elementOrSelector)
  }

  return {
    /** Attach the ApiReferenceEditor to a given DOM node */
    mount,
    /** Update the complete config (replaces original config) */
    updateConfig: (newConfig: ApiReferenceConfigurationSchema) => {
      objectMerge(props, { configuration: newConfig })
    },
    /** Update only the spec value - used for external state mode */
    updateSpecValue: (specString: string) => {
      props.configuration.spec = { content: specString }
    },
  }
}

export { ApiReferenceEditor }
