import { type EventBusKey, useEventBus } from '@vueuse/core'

/** Possible request statuses */
type RequestStatus = 'start' | 'stop' | 'abort'

/**
 * Event bus to execute requests, usually triggered by the send button in the address bar
 * OR the keyboard shortcut
 */
const requestStatusBusKey: EventBusKey<void> = Symbol()
export const requestStatusBus = useEventBus<RequestStatus>(requestStatusBusKey)
