import { type EventBusKey, useEventBus } from '@vueuse/core'
import { ref } from 'vue'

export type LazyEvent = { loading?: string; loaded?: string; save: boolean }

/** Keep track of which elements are loading and which have loaded */
const lazyEventBusKey: EventBusKey<LazyEvent> = Symbol()

/** All aboard the lazy bus! */
export const lazyBus = useEventBus(lazyEventBusKey)

/** Ensure we only lazy load once per page load */
export const hasLazyLoaded = ref(false)
