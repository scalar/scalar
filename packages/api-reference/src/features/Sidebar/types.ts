/** Copied from the old useSidebar hook for backwards compatibility, we will update it later */
export type SidebarEntry = {
  id: string
  title: string
  children?: SidebarEntry[]
  httpVerb?: string
  operationId?: string
  path?: string
  deprecated?: boolean
  isGroup?: boolean
}
