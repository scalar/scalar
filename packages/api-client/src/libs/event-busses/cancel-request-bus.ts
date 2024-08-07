import { type EventBusKey, useEventBus } from '@vueuse/core'

/**
 * Event bus to execute requests, usually triggered by the send button in the address bar
 * OR the keyboard shortcut
 */
const cancelRequestBusKey: EventBusKey<void> = Symbol()
export const cancelRequestBus = useEventBus(cancelRequestBusKey)
