<script setup lang="ts">
import { ScalarSidebar, ScalarSidebarItems } from '@scalar/components'

import { filterItems } from '@/helpers/filter-items'
import type {
  DraggingItem,
  HoveredItem,
  UseDraggableOptions,
} from '@/hooks/use-draggable'
import type { Item, Layout } from '@/types'

import SidebarItem from './SidebarItem.vue'

const {
  layout,
  items,
  indent = 20,
} = defineProps<{
  /**
   * Layout type for the sidebar.
   * Determines whether the sidebar should behave in 'client' or 'reference' mode.
   */
  layout: Layout
  /**
   * List of items to render in the sidebar.
   */
  items: Item[]
  /**
   * Function to determine whether a given item (by id) is currently selected.
   */
  isSelected: (id: string) => boolean
  /**
   * Function to determine whether a given item (by id) is currently expanded (open to show children).
   */
  isExpanded: (id: string) => boolean
  /**
   * Sidebar configuration options.
   * - operationTitleSource: sets whether operations show their path or summary as the display title.
   */
  options?: {
    operationTitleSource: 'path' | 'summary' | undefined
  }
  /**
   * The indentation in pixels to apply to nested items/groups in the sidebar.
   */
  indent?: number
  /**
   * Prevents this item from being dragged.
   *
   * @default true
   */
  isDraggable?: UseDraggableOptions['isDraggable']
  /**
   * Prevents this item from being hovered and dropped into. Can be either a function or a boolean.
   *
   * @default true
   */
  isDroppable?: UseDraggableOptions['isDroppable']
}>()

const emit = defineEmits<{
  /**
   * Emitted when the user reorders sidebar items via drag-and-drop.
   * @param draggingItem - The item being dragged.
   * @param hoveredItem - The item currently being hovered over.
   */
  (e: 'reorder', draggingItem: DraggingItem, hoveredItem: HoveredItem): void

  /**
   * Emitted when a sidebar item is selected.
   * @param id - The id of the selected item.
   */
  (e: 'selectItem', id: string): void
}>()

const slots = defineSlots<{
  /** Overrides the main items list */
  default?(): unknown
  /** Adds an optional decorator for each item like an edit menu */
  decorator?(props: { item: Item }): unknown
  /** Places content at the top of the sidebar outside of the items list */
  header?(): unknown
  /** Places content at the bottom of the sidebar outside of the items list */
  footer?(): unknown
  /** Places content before the first item in the items list */
  before?(): unknown
  /** Places content when an item is empty */
  empty?(props: { item: Item }): unknown
  /** Places content when an item is empty */
  icon?(props: { item: Item; open: boolean }): unknown
}>()

/**
 * Handle drag and drop reordering of sidebar items.
 * Emit the reorder event to the parent component for handling.
 */
const handleDragEnd = (
  draggingItem: DraggingItem,
  hoveredItem: HoveredItem,
) => {
  emit('reorder', draggingItem, hoveredItem)
}
</script>
<template>
  <ScalarSidebar
    class="flex min-h-0 flex-col"
    :style="{
      '--scalar-sidebar-indent': indent + 'px',
    }">
    <slot name="header" />
    <slot>
      <ScalarSidebarItems class="custom-scroll pt-0">
        <!-- First item -->
        <slot name="before" />
        <SidebarItem
          v-for="item in filterItems(layout, items)"
          :key="item.id"
          :isDraggable="isDraggable ?? layout === 'client'"
          :isDroppable="isDroppable"
          :isExpanded="isExpanded"
          :isSelected="isSelected"
          :item="item"
          :layout="layout"
          :options="options"
          @onDragEnd="handleDragEnd"
          @selectItem="(id) => emit('selectItem', id)">
          <template
            v-if="slots.decorator"
            #decorator="props">
            <slot
              name="decorator"
              v-bind="props" />
          </template>
          <template
            v-if="slots.empty"
            #empty="props">
            <slot
              name="empty"
              v-bind="props" />
          </template>
          <template
            v-if="slots.icon"
            #icon="props">
            <slot
              name="icon"
              v-bind="props" />
          </template>
        </SidebarItem>
      </ScalarSidebarItems>
      <!-- Spacer -->
      <div class="flex-1"></div>
    </slot>
    <slot name="footer" />
  </ScalarSidebar>
</template>
