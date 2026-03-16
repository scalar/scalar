<script lang="ts">
/**
 * Scalar Sidebar Playground component
 *
 * THIS IS A TESTING COMPONENT FOR THE SIDEBAR.
 * IT IS NOT INTENDED TO BE USED IN PRODUCTION.
 */
export default {}
</script>
<script setup lang="ts">
import ScalarSidebar from './ScalarSidebar.vue'
import ScalarSidebarFooter from './ScalarSidebarFooter.vue'
import ScalarSidebarSearchInput from './ScalarSidebarSearchInput.vue'

defineProps<{
  /**
   * Overrides --scalar-sidebar-indent
   * @default 20 (px)
   */
  indent?: number
  /**
   * Sets --scalar-sidebar-background-1
   * @default var(--scalar-background-1)
   */
  backgroundOne?: string
  /**
   * Sets --scalar-sidebar-color-1
   * @default var(--scalar-color-1)
   */
  colorOne?: string
  /**
   * Sets --scalar-sidebar-color-2
   * @default var(--scalar-color-2)
   */
  colorTwo?: string
  /**
   * Sets --scalar-sidebar-border-color
   * @default var(--scalar-border-color)
   */
  borderColor?: string
  /**
   * Sets --scalar-sidebar-item-hover-background
   * @default var(--scalar-background-2)
   */
  itemHoverBackground?: string
  /**
   * Sets --scalar-sidebar-item-hover-color
   * @default currentColor
   */
  itemHoverColor?: string
  /**
   * Sets --scalar-sidebar-item-active-background
   * @default var(--scalar-background-2)
   */
  itemActiveBackground?: string
  /**
   * Sets --scalar-sidebar-color-active
   * @default var(--scalar-color-1)
   */
  itemActiveColor?: string
  /**
   * Sets --scalar-sidebar-indent-border
   * @default var(--scalar-border-color)
   */
  indentBorder?: string
  /**
   * Sets --scalar-sidebar-indent-border-hover
   * @default var(--scalar-border-color)
   */
  indentBorderHover?: string
  /**
   * Sets --scalar-sidebar-indent-border-active
   * @default var(--scalar-color-accent)
   */
  indentBorderActive?: string
  /**
   * Sets --scalar-sidebar-search-background
   * @default transparent
   */
  searchBackground?: string
  /**
   * Sets --scalar-sidebar-search-color
   * @default var(--scalar-color-3)
   */
  searchColor?: string
  /**
   * Sets --scalar-sidebar-search-border-color
   * @default var(--scalar-border-color)
   */
  searchBorderColor?: string
}>()

const selected = defineModel<string>('selected')
</script>
<template>
  <div class="flex h-screen">
    <ScalarSidebar
      class="t-doc__sidebar"
      :style="{
        '--scalar-sidebar-indent': indent ? indent + 'px' : undefined,
        '--scalar-sidebar-background-1': backgroundOne,
        '--scalar-sidebar-color-1': colorOne,
        '--scalar-sidebar-color-2': colorTwo,
        '--scalar-sidebar-border-color': borderColor,
        '--scalar-sidebar-item-hover-background': itemHoverBackground,
        '--scalar-sidebar-item-hover-color': itemHoverColor,
        '--scalar-sidebar-item-active-background': itemActiveBackground,
        '--scalar-sidebar-color-active': itemActiveColor,
        '--scalar-sidebar-indent-border': indentBorder,
        '--scalar-sidebar-indent-border-hover': indentBorderHover,
        '--scalar-sidebar-indent-border-active': indentBorderActive,
        '--scalar-sidebar-search-background': searchBackground,
        '--scalar-sidebar-search-color': searchColor,
        '--scalar-sidebar-search-border-color': searchBorderColor,
      }">
      <div class="custom-scroll flex min-h-0 flex-1 flex-col overflow-x-clip">
        <slot name="search">
          <div class="bg-sidebar-b-1 sticky top-0 z-1 px-3 pt-3">
            <ScalarSidebarSearchInput />
          </div>
        </slot>
        <slot>
          <div class="grid flex-1 p-3">
            <div class="placeholder">Sidebar content</div>
          </div>
        </slot>
      </div>
      <slot name="footer">
        <ScalarSidebarFooter />
      </slot>
    </ScalarSidebar>
    <div class="text-c-2 flex flex-1 items-center justify-center">
      <template v-if="selected"> {{ selected }} Selected </template>
      <template v-else> Select an item in the sidebar </template>
    </div>
  </div>
</template>
