import type { XScalarTabs } from '@/schemas/extensions/workspace/x-scalar-tabs'

/** Event definitions to control the tabs */
export type TabEvents = {
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
  /**
   * Navigates to the previous tab
   */
  'tabs:navigate:previous':
    | undefined
    | {
        event: KeyboardEvent
      }
  /**
   * Navigates to the next tab
   */
  'tabs:navigate:next':
    | undefined
    | {
        event: KeyboardEvent
      }
  /**
   * Jumps to a specific tab, we can grab the number from the keyboard event
   */
  'tabs:focus:tab': { event: KeyboardEvent } | { index: number }
  /**
   * Focuses the last tab
   */
  'tabs:focus:tab-last':
    | undefined
    | {
        event: KeyboardEvent
      }
  'tabs:copy:url': { index: number }
}
