/** Event definitions to control the tabs */
export type TabEvents = {
  /**
   * Add a new tab
   */
  'tabs:add:tab': undefined
  /**
   * Closes the current tab
   */
  'tabs:close:tab': undefined
  /**
   * Navigates to the previous tab
   */
  'tabs:navigate:previous': undefined
  /**
   * Navigates to the next tab
   */
  'tabs:navigate:next': undefined
  /**
   * Jumps to a specific tab
   */
  'tabs:focus:tab': {
    /** The index of the tab to jump to */
    index: number
  }
  /**
   * Focuses the last tab
   */
  'tabs:focus:tab-last': undefined
}
