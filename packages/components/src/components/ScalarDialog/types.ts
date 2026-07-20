/** Props for the ScalarDialog component */
export type ScalarDialogProps = {
  /**
   * Controls whether the dialog contents are torn down when the dialog closes.
   *
   * When true (the default) the contents are unmounted on close, so child
   * components mount fresh on each open and their lifecycle hooks fire in step
   * with the dialog's open state. Set it to false to keep the contents mounted
   * and preserve their state across open and close.
   *
   * @default true
   */
  unmount?: boolean
  /**
   * Whether clicking the backdrop (outside the dialog) closes it.
   *
   * @default true
   */
  closeOnBackdrop?: boolean
}
