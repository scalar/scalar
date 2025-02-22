import type { Collection, Request, RequestExample, RequestMethod, Tag } from '@scalar/oas-utils/entities/spec'
import type { RouteLocationRaw } from 'vue-router'

export type SidebarItem = {
  title: string
  entity: Collection | Tag | Request | RequestExample | { type: 'unknown'; uid: string }
  resourceTitle: string
  children: string[]
  method?: RequestMethod | undefined
  to?: RouteLocationRaw | undefined
  warning?: string
  icon?: string
  edit: (name: string, icon?: string) => void
  delete: () => void
  documentUrl?: string | undefined
  watchMode?: boolean
}

export type SidebarMenuItem = {
  /** The resource which we are opening the menu for */
  item?: SidebarItem
  /** Array of parentUids used when nesting in the sidemenu */
  parentUids?: string[]
  /** Target ref from the button which triggered the menu for positioning */
  targetRef?: HTMLButtonElement
  /** Controls wether the menu is open or not */
  open: boolean
}
