/** Event definitions to control the tabs */
export type TabEvents = {
  /**
   * Add a new tab
   */
  'tabs:add:tab': {
    event: KeyboardEvent
  }
  /**
   * Closes the current tab
   */
  'tabs:close:tab': {
    event: KeyboardEvent
  }
  /**
   * Navigates to the previous tab
   */
  'tabs:navigate:previous': {
    event: KeyboardEvent
  }
  /**
   * Navigates to the next tab
   */
  'tabs:navigate:next': {
    event: KeyboardEvent
  }
  /**
   * Jumps to a specific tab, we can grab the number from the keyboard event
   */
  'tabs:focus:tab': {
    event: KeyboardEvent
  }
  /**
   * Focuses the last tab
   */
  'tabs:focus:tab-last': {
    event: KeyboardEvent
  }
}
