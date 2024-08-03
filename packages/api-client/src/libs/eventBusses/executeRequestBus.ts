import { type EventBusKey, useEventBus } from '@vueuse/core'

/** A callback for when the request completes */
type ExecuteRequestCallback = () => void

/**
 * Event bus to execute requests, usually triggered by the send button in the address bar
 * OR the keyboard shortcut
 */
const executeRequestBusKey: EventBusKey<void> = Symbol()
export const executeRequestBus =
  useEventBus<ExecuteRequestCallback>(executeRequestBusKey)
