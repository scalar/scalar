import ApiReferenceEditor from '@/components/ApiReferenceEditor.vue'
import { UPDATE_EVENT } from '@/constants'
import {
  type ReferenceConfiguration,
  type ReferenceProps,
  objectMerge,
} from '@scalar/api-reference'
import { createApp, h, reactive } from 'vue'

/** Attach the Editable API Reference to the DOM */
export function mountApiReferenceEditable(
  /** Element to mount the references to */
  el: string | HTMLElement,
  /** Base configuration */
  configuration: ReferenceProps['configuration'] & {
    useExternalState?: boolean
  } = {},
  /** Optional event handler to trigger when the editor input changes */
  onUpdate?: (v: string) => void,
) {
  const mountEl = typeof el === 'string' ? document.querySelector(el) : el
  if (!mountEl) {
    console.error(
      'INVALID HTML ELEMENT PROVIDED: Can not mount Scalar API References',
    )
    return { updateConfig: () => null, updateSpecValue: () => null }
  }

  // Reactive props that can be set
  const props = reactive({ configuration })

  // We use a render wrapper to enable reactive props on root
  const app = createApp({
    render: () => h(ApiReferenceEditor, props),
  })

  app.mount(mountEl)

  // If an event handler is provided we capture the event.
  if (onUpdate) {
    mountEl.addEventListener(UPDATE_EVENT, (evt) => {
      const event = evt as CustomEvent<{ value: string }>
      onUpdate(event?.detail?.value || '')
    })
  }

  return {
    /** Update the complete config (replaces original config) */
    updateConfig: (newConfig: ReferenceConfiguration) => {
      objectMerge(props, { configuration: newConfig })
    },
    /** Update only the spec value - used for external state mode */
    updateSpecValue: (specString: string) => {
      props.configuration.spec = { content: specString }
    },
  }
}

export { ApiReferenceEditor }
