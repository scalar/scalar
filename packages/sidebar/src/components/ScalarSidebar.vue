<script setup lang="ts">
import { ScalarSidebar, ScalarSidebarItems } from '@scalar/components'
import type { DraggingItem, HoveredItem } from '@scalar/draggable'

import SidebarItem, { type Item } from './SidebarItem.vue'

const { layout, items } = defineProps<{
  /** Layout type */
  layout: 'client' | 'reference'
  /** Sidebar state */
  items: Item[]
  isSelected: (id: string) => boolean
  isExpanded: (id: string) => boolean
  options?: {
    operationTitleSource: 'path' | 'summary' | undefined
  }
}>()

const emit = defineEmits<{
  (e: 'reorder', draggingItem: DraggingItem, hoveredItem: HoveredItem): void
  (e: 'selectItem', id: string): void
}>()

defineSlots<{
  'entry-decorator'?(props: { item: Item }): unknown
  footer?(): unknown
  header?(): unknown
  default?(): unknown
  firstItem?(): unknown
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
  <ScalarSidebar class="flex min-h-0 flex-col">
    <slot name="header" />
    <slot>
      <ScalarSidebarItems class="custom-scroll pt-0">
        <!-- First item -->
        <slot name="firstItem" />

        <SidebarItem
          v-for="item in items"
          :key="item.id"
          :isExpanded="isExpanded"
          :isSelected="isSelected"
          :item="item"
          :layout="layout"
          :options="options"
          @onDragEnd="handleDragEnd"
          @selectItem="(id) => emit('selectItem', id)">
          <template #aside="props">
            <slot
              name="entry-decorator"
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
