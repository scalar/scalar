import type {
  Collection,
  Request,
  RequestExample,
  RequestMethod,
  Tag,
} from '@scalar/oas-utils/entities/spec'
import { type EventBusKey, useEventBus } from '@vueuse/core'
import type { Ref } from 'vue'

export type Item = {
  title: string
  entity: Collection | Tag | Request | RequestExample
  resourceTitle: string
  children: string[]
  method?: RequestMethod
  link?: string
  warning?: string
  rename: (name: string) => void
  delete: () => void
}

export type RequestSidebarMenuBusEvent = {
  /** The resource which we are opening the menu for */
  item: Item
  /** Array of parentUids used when nesting in the sidemenu */
  parentUids: string[]
  /** Target ref from the button which triggered the menu for positioning */
  targetRef: Ref<HTMLButtonElement>
}
const RequestSidebarMenuBusKey: EventBusKey<RequestSidebarMenuBusEvent> =
  Symbol()

/**
 * Event bus for openening the sidebar menu
 */
export const requestSidebarMenuBus = useEventBus(RequestSidebarMenuBusKey)
