import type { ApiReferenceEvent, ApiReferenceEvents } from './definitions'
import { onBeforeUnmount, type Ref, watch } from 'vue'

/**
 * Vue wrapper for attaching and removing event listeners
 *
 */
export function onCustomEvent<E extends ApiReferenceEvent>(
  el: Ref<HTMLElement | null>,
  event: E,
  handler: (event: ApiReferenceEvents[E]) => void,
) {
  // Any time the element reference changes, we need to add the event listener
  watch(
    () => el.value,
    (element) => {
      if (!element) {
        return
      }

      element.addEventListener(event as keyof HTMLElementEventMap, handler as any)
    },
    { immediate: true },
  )

  onBeforeUnmount(() => {
    if (!el.value) {
      return
    }

    el.value.removeEventListener(event as keyof HTMLElementEventMap, handler as any)
  })
}
