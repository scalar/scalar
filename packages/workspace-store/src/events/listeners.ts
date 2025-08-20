import type { ApiReferenceEvent, ApiReferenceEvents } from './definitions'
import { onBeforeUnmount, type Ref, watch } from 'vue'

type EventDetail<T> = T extends object ? T & { callback: () => void } : T

/**
 * Vue wrapper for attaching and removing event listeners
 *
 */
export function onCustomEvent<E extends ApiReferenceEvent>(
  el: Ref<HTMLElement | null>,
  event: E,
  handler: (event: CustomEvent<ApiReferenceEvents[E]['detail']>) => void,
) {
  const listener = (event: CustomEvent<EventDetail<ApiReferenceEvents[E]['detail']>>) => {
    handler(event)

    if (typeof event.detail === 'object') {
      event.detail.callback()
    }
  }

  // Any time the element reference changes, we need to add the event listener
  watch(
    () => el.value,
    (element) => {
      if (!element) {
        return
      }

      element.addEventListener(event, listener as any)
    },
    { immediate: true },
  )

  onBeforeUnmount(() => {
    if (!el.value) {
      return
    }

    el.value.removeEventListener(event, listener as any)
  })
}
