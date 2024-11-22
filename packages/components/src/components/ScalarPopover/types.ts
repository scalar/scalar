import type { Slot } from 'vue'

export type Slots = {
  default(props: {
    /** Whether or not the popover is open */
    open: boolean
  }): Slot
  /** The popover contents */
  popover(props: {
    /** Whether or not the popover is open */
    open: boolean
    /** A callback to close the popover */
    close: () => void
  }): Slot
}
