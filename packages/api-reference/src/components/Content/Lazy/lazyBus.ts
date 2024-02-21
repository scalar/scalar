import { type EventBusKey, useEventBus } from '@vueuse/core'

/**
 * Setup an event bus so we can listen for loaded events
 */
const lazyEventBusKey: EventBusKey<{ id: string }> = Symbol('lazyEventBusKey')
export const lazyBus = useEventBus(lazyEventBusKey)
