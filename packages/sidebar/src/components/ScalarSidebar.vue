<script setup lang="ts">
import { ScalarSidebar, ScalarSidebarItems } from '@scalar/components'
import type { DraggingItem, HoveredItem } from '@scalar/draggable'

import { type SidebarState } from '../helpers/create-sidebar-state'
import SidebarItem, { type Item } from './SidebarItem.vue'

const { layout, state } = defineProps<{
  /** Layout type */
  layout: 'client' | 'reference'
  /** Sidebar state */
  state: SidebarState<Item>
}>()

const emit = defineEmits<{
  (e: 'reorder', draggingItem: DraggingItem, hoveredItem: HoveredItem): void
}>()

defineSlots<{
  aside?(props: { item: Item }): unknown
  footer?(): unknown
  search?(): unknown
  default?(): unknown
  firstItem?(): unknown
}>()

const handleClick = (id: string) => {
  state.setSelected(id)
  state.setExpanded(id, !state.expandedItems.value[id])
}

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
  <ScalarSidebar>
    <div class="custom-scroll flex min-h-0 flex-1 flex-col overflow-x-clip">
      <!-- Search -->
      <slot name="search" />

      <slot>
        <ScalarSidebarItems>
          <!-- First item -->
          <slot name="firstItem" />

          <SidebarItem
            v-for="item in state.items"
            :key="item.id"
            :expandedItems="state.expandedItems.value"
            :item="item"
            :layout="layout"
            :selectedItems="state.selectedItems.value"
            @click="handleClick"
            @onDragEnd="handleDragEnd">
            <template #aside="props">
              <slot
                name="aside"
                v-bind="props" />
            </template>
          </SidebarItem>
        </ScalarSidebarItems>

        <!-- Spacer -->
        <div class="flex-1"></div>
      </slot>
    </div>
    <slot name="footer" />
  </ScalarSidebar>
</template>
