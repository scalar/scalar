import { type Ref, onBeforeUnmount, watch } from 'vue'

import type { ApiReferenceEvent, ApiReferenceEvents } from './definitions'

/**
 * Vue wrapper for attaching and removing event listeners
 *
 */
export function onCustomEvent<E extends ApiReferenceEvent>(
  el: Ref<HTMLElement | null>,
  event: E,
  handler: (event: CustomEvent<ApiReferenceEvents[E]['detail']>) => void,
) {
  // Any time the element reference changes, we need to add the event listener
  watch(
    () => el.value,
    (element) => {
      if (!element) {
        return
      }

      element.addEventListener(event, handler as any)
    },
    { immediate: true },
  )

  onBeforeUnmount(() => {
    if (!el.value) {
      return
    }

    el.value.removeEventListener(event, handler as any)
  })
}
