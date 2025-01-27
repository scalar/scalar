import type { Component } from 'vue'

import type { Icon } from '../ScalarIcon'

/** Scalar Sidebar Item Props */
export type ScalarSidebarItemProps = {
  /** Overrides the rendered element */
  is?: Component | string
  /** Sets the icon for the item */
  icon?: Icon
  /** Wether or not the item is selected */
  selected?: boolean
  disabled?: boolean
}

/** Scalar Sidebar Item Slots */
export type ScalarSidebarItemSlots = {
  /** The main text content of the button */
  default?: () => any
  /** Override the icon */
  icon?: () => any
  /** The content to display to the right of the text content */
  aside?: () => any
}
