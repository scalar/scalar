/** Event definitions for the workspace/document meta */
export type MetaEvents = {
  /**
   * Update the dark mode theme setting
   */
  'update:dark-mode': boolean
  /**
   * Update the active document on the workspace
   */
  'update:active-document': string
  /**
   * Update the selected client on the workspace.
   * Either a built-in client id (e.g. `js/fetch`) or a custom sample id (e.g. `custom/python`).
   *
   * See the note in `workspace.ts` on why this is a plain string.
   */
  'update:selected-client': string
}
