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
  /**
   * Enables separate buttons and events for the group toggle and item label
   *
   * @example
   * <ScalarSidebarGroup discrete>
   *   ...
   * </ScalarSidebarGroup>
   */
  discrete?: boolean
}

/** Scalar Sidebar Item Slots */
export type ScalarSidebarButtonSlots = {
  /** The main text content of the button */
  default?(): unknown
  /** The indent to display before content */
  indent?(): unknown
  /** Override the icon */
  icon?(): unknown
  /** The content to display to the right of the text content */
  aside?(): unknown
}

/** Scalar Sidebar Item Slots */
export type ScalarSidebarItemSlots = Omit<ScalarSidebarButtonSlots, 'indent'> & {
  /** Override the entire button */
  button?(props: { level: SidebarGroupLevel }): unknown
  /** Content to display before the button but inside the list item */
  before?(): unknown
  /** Content to display after the button but inside the list item */
  after?(): unknown
}

/** Scalar Sidebar Item Slots */
export type ScalarSidebarGroupSlots = {
  /** The text content of the toggle */
  default?(props: { open: boolean }): unknown
  /** Override the entire toggle button */
  button?(props: { open: boolean; level: SidebarGroupLevel }): unknown
  /** Icon for the sidebar group */
  icon?(props: { open: boolean }): unknown
  /** Content to display to the right of the text content */
  aside?(props: { open: boolean }): unknown
  /** Content to display before the button */
  before?(props: { open: boolean }): unknown
  /** Content to display after the button */
  after?(props: { open: boolean }): unknown
  /** The list of sidebar subitems */
  items?(props: { open: boolean }): unknown
}
