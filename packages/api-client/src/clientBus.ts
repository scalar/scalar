import { useEventBus } from '@vueuse/core'

// User clicks on generated security parameter
export const clickGeneratedParameter = useEventBus(Symbol())
