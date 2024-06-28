import type { OpenClientPayload } from '@scalar/api-client'
import type { ModalState } from '@scalar/components'
import type { AuthenticationState, SpecConfiguration } from '@scalar/oas-utils'
import { type EventBusKey, useEventBus } from '@vueuse/core'
import type { RequireAtLeastOne } from 'type-fest'

type ApiClientEvents = RequireAtLeastOne<{
  open?: OpenClientPayload
  updateAuth?: AuthenticationState
  updateSpec?: SpecConfiguration
}>
const apiClientBusKey: EventBusKey<ApiClientEvents> = Symbol()
const apiClientModalStateBusKey: EventBusKey<ModalState> = Symbol()

/**
 * Event bus for controlling the Api Client
 *
 * There is a limitation in useEventBus with mapping the event with the payload type. This is a workaround, however
 * doing it this way allows us to "fire" multiple events at the same time which is actually kind of nice
 */
export const apiClientBus = useEventBus(apiClientBusKey)
export const modalStateBus = useEventBus(apiClientModalStateBusKey)
