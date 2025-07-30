import { type EventBusKey, useEventBus } from '@vueuse/core'
import { ref } from 'vue'

/** Keep track of which elements are loading and which have loaded */
const lazyEventBusKey: EventBusKey<{ loading?: string; loaded?: string }> = Symbol()

/** All aboard the lazy bus! */
export const lazyBus = useEventBus(lazyEventBusKey)

/** Ensure we only lazy load once per page load */
export const hasLazyLoaded = ref(false)
