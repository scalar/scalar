import type { ScalarIconComponent } from '@scalar/icons/types'
import type { Component } from 'vue'

import type { Icon } from '../ScalarIcon'
import type { SidebarGroupLevel } from './useSidebarGroups'

/** Scalar Sidebar Item Props */
export type ScalarSidebarItemProps = {
  /** Overrides the rendered element */
  is?: Component | string
  /** Sets the icon for the item */
  icon?: Icon | ScalarIconComponent
  /**
   * Wether or not the item is active
   *
   * Should be true if the item or any of its children are being displayed on the page
   */
  active?: boolean
  /**
   * Wether or not the item is selected
   *
   * Should be true if the item is being displayed on the page
   */
  selected?: boolean
  /** Wether or not the item is disabled */
  disabled?: boolean
  /** The level of the sidebar group */
  indent?: SidebarGroupLevel
}

export type ScalarSidebarGroupProps = ScalarSidebarItemProps & {
  /**
   * Disables the internal open state for the group
   *
   *
   * @example
   * <script setup lang="ts">
   * import { ref } from 'vue'
   *
   * // External state to control the group
   * const myRef = ref(false)
   * </script>
   * <template>
   *   <ScalarSidebarGroup
   *     :open="myRef"
   *     controlled
   *     @click="myRef = !myRef">
   *     ...
   *   </ScalarSidebarGroup>
   * </template>
   */
  controlled?: boolean
}

/** Scalar Sidebar Item Slots */
export type ScalarSidebarItemSlots = {
  /** The main text content of the button */
  default?(): unknown
  /** Override the icon */
  icon?(): unknown
  /** The content to display to the right of the text content */
  aside?(): unknown
  /** The indent to display before content */
  indent?(): unknown
}
