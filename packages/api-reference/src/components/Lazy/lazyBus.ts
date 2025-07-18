import { type EventBusKey, useEventBus } from '@vueuse/core'

const lazyEventBusKey: EventBusKey<{ id: string }> = Symbol()

/** All aboard the lazy bus! */
export const lazyBus = useEventBus(lazyEventBusKey)

/** Set of all ID's which are lazy, doesn't need to be reactive */
export const lazyIds = new Set<string>()
