export type Slots = {
  default(props: {
    /** Whether or not the popover is open */
    open: boolean
  }): any
  /** The popover contents */
  popover(props: {
    /** Whether or not the popover is open */
    open: boolean
    /** A callback to close the popover */
    close: () => void
  }): any
  /** Overrides the popover backdrop */
  backdrop?(props: {
    /** Whether or not the popover is open */
    open: boolean
  }): any
}
