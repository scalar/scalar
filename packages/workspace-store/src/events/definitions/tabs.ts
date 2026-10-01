import type { XScalarTabs } from '@/schemas/extensions/workspace/x-scalar-tabs'

import type { NavigationEvents } from './navigation'

/** Event definitions to control the tabs */
export type TabEvents = Pick<NavigationEvents, Extract<keyof NavigationEvents, `tabs:${string}`>> & {
  /**
   * Update the tabs of the workspace
   */
  'tabs:update:tabs': XScalarTabs
  /**
   * Add a new tab
   */
  'tabs:add:tab':
    | {
        event: KeyboardEvent
      }
    | undefined
  /**
   * Closes the current tab
   */
  'tabs:close:tab': { event: KeyboardEvent } | { index: number }
  /**
   * Closes all other tabs except the one at the given index
   */
  'tabs:close:other-tabs': { index: number }

  'tabs:copy:url': { index: number }
}
