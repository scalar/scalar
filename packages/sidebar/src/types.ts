import type { TraversedEntry } from '@scalar/workspace-store/schemas/navigation'

/**
 * A local re-export of TraversedEntry used in the sidebar components
 */
export type Item = TraversedEntry

export type Layout = 'client' | 'reference'

export type SidebarOptions = Partial<{
  operationTitleSource: 'path' | 'summary'
  /**
   * Whether to hide the default examples for operations if there are no other examples.
   *
   * @default false
   */
  hideOperationDefaultExamples: boolean
  /**
   * Whether to show the `x-badges` of operations, webhooks, tags, tag groups and models next to their titles.
   *
   * @default false
   */
  showBadgesInSidebar: boolean
  labels: Partial<{
    closeGroup: string
    httpMethod: string
    openGroup: string
  }>
}>
