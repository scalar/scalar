import type {
  Collection,
  Request,
  RequestExample,
  RequestMethod,
  Tag,
} from '@scalar/oas-utils/entities/spec'

export type SidebarItem = {
  title: string
  entity: Collection | Tag | Request | RequestExample
  resourceTitle: string
  children: string[]
  method?: RequestMethod
  link?: string
  warning?: string
  icon?: string
  edit: (name: string, icon?: string) => void
  delete: () => void
  documentUrl?: string
  watchForChanges?: boolean
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
