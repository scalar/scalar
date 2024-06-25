import type { OpenClientPayload } from '@scalar/api-client-modal'
import type { ModalState } from '@scalar/components'
import { type EventBusKey, useEventBus } from '@vueuse/core'

const apiClientBusKey: EventBusKey<OpenClientPayload> = Symbol()
const apiClientModalStateBusKey: EventBusKey<ModalState> = Symbol()

/** Event bus to open the API Client */
export const apiClientBus = useEventBus(apiClientBusKey)
export const modalStateBus = useEventBus(apiClientModalStateBusKey)
