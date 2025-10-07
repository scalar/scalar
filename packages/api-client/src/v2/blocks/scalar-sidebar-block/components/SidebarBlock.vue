<script setup lang="ts">
import { ScalarSidebar } from '@scalar/components'
import type { TraversedEntry } from '@scalar/workspace-store/schemas/navigation'

import { createSidebarState } from '@/v2/blocks/scalar-sidebar-block/helpers/create-sidebar-state'

import SidebarItem from './SidebarItem.vue'

const {
  xNavigation,
  layout,
  indent = 20,
} = defineProps<{
  /** Precomputed navigation structure for the document */
  xNavigation: TraversedEntry[]
  /** Indentation size in pixels */
  indent?: number
  /** Layout type */
  layout: 'client' | 'reference'
}>()

const filteredItems = (items: TraversedEntry[]) => {
  if (layout === 'reference') {
    return items
  }

  // For client layout, filter to only show webhooks and operations with children
  return items.filter(
    (c) =>
      'children' in c &&
      c.children?.length &&
      c.children.some(
        (child) => child.type === 'webhook' || child.type === 'operation',
      ),
  )
}

const state = createSidebarState(xNavigation)

const handleClick = (id: string) => {
  state.setSelected(id)
  state.setExpanded(id, !state.expandedItems.value[id])
}
</script>
<template>
  <ScalarSidebar
    class="t-doc__sidebar"
    :style="{
      '--scalar-sidebar-indent': indent + 'px',
      '--scalar-sidebar-indent-border-hover': 'var(--scalar-color-3)',
      '--scalar-sidebar-indent-border-active': 'var(--scalar-color-accent)',
    }">
    <div class="custom-scroll flex min-h-0 flex-1 flex-col overflow-x-clip">
      <slot name="search" />
      <slot>
        <div class="grid p-3">
          <SidebarItem
            v-for="item in filteredItems(xNavigation)"
            :key="item.id"
            :expandedItems="state.expandedItems.value"
            :item="item"
            :layout="layout"
            :selectedItems="state.selectedItems.value"
            @click="handleClick" />
        </div>
        <!-- Spacer -->
        <div class="flex-1"></div>
      </slot>
    </div>
    <slot name="footer" />
  </ScalarSidebar>
</template>
