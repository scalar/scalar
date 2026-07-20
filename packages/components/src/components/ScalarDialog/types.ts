/** Props for the ScalarDialog component */
export type ScalarDialogProps = {
  /**
   * Keeps the dialog contents mounted while it is closed.
   *
   * By default the contents are torn down on close, so child components mount
   * fresh on each open and their lifecycle hooks fire in step with the dialog's
   * open state. Set this to keep the contents mounted and preserve their state
   * across open and close.
   *
   * @default false
   */
  persist?: boolean
}
