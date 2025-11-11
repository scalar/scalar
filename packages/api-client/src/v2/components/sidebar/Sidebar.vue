<script setup lang="ts">
import { ScalarIconButton, ScalarSidebarSearchInput } from '@scalar/components'
import { ScalarIconMagnifyingGlass } from '@scalar/icons'
import { ScalarSidebar, type SidebarState } from '@scalar/sidebar'
import type { TraversedEntry } from '@scalar/workspace-store/schemas/navigation'
import { ref } from 'vue'

import { Resize } from '@/v2/components/resize'
import type { ClientLayout } from '@/v2/types/layout'

import SidebarMenu from './SidebarMenu.vue'
import SidebarToggle from './SidebarToggle.vue'

const { sidebarState, layout } = defineProps<{
  /** All documents to display sidebar items for */
  sidebarState: SidebarState<TraversedEntry>
  /** Layout for the client */
  layout: ClientLayout
}>()

const emit = defineEmits<{
  /** Emitted when an item is selected */
  (e: 'selectItem', id: string): void
}>()

defineSlots<{
  /** Slot to add the workspace button */
  workspaceButton?(): unknown
  /** Slot to add additional content to the footer */
  footer?(): unknown
}>()

const log = (name: string, ...args: any[]) => {
  console.log('[LOG] event name: ', name)
  console.log('[LOG]', ...args)
}

/** Propagate up the workspace model to the parent */
const workspaceModel = defineModel<string>('workspace', {
  default: 'default',
})

/** Controls the visibility of the sidebar */
const isSidebarOpen = defineModel<boolean>('isSidebarOpen', {
  required: true,
})

/** Controls the visibility of the search input */
const isSearchVisible = ref(false)

/** Controls the width of the sidebar */
const sidebarWidth = defineModel<number>('sidebarWidth', {
  required: true,
  default: 288,
})
</script>
<template>
  <Resize
    v-model:width="sidebarWidth"
    class="flex flex-col">
    <template #default>
      <ScalarSidebar
        class="flex w-auto flex-1 pt-2"
        :isExpanded="sidebarState.isExpanded"
        :isSelected="sidebarState.isSelected"
        :items="sidebarState.items.value"
        layout="client"
        @reorder="(...args) => log('reorder', ...args)"
        @selectItem="(id) => emit('selectItem', id)">
        <template #search>
          <div
            class="bg-sidebar-b-1 sticky top-0 z-1 flex flex-col gap-3 px-3 pt-3">
            <div class="flex items-center justify-between">
              <!-- Desktop gets the workspace menu here  -->
              <SidebarMenu
                v-if="layout === 'desktop'"
                v-model:workspace="workspaceModel" />

              <!-- Toggle the sidebar -->
              <SidebarToggle
                v-else-if="layout === 'modal'"
                v-model="isSidebarOpen" />

              <!-- Toggle search, always visible on web -->
              <ScalarIconButton
                v-if="layout !== 'web'"
                :icon="ScalarIconMagnifyingGlass"
                label="Search"
                @click="isSearchVisible = !isSearchVisible" />
            </div>

            <!-- Search input, always visible on web -->
            <ScalarSidebarSearchInput
              v-if="isSearchVisible || layout === 'web'"
              :autofocus="layout !== 'web'" />
          </div>
        </template>

        <template #before>
          <slot name="workspaceButton" />
        </template>

        <template #footer>
          <slot name="footer" />
        </template>
      </ScalarSidebar>
    </template>
  </Resize>
</template>
