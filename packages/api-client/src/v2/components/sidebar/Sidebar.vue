<script setup lang="ts">
import { ScalarIconButton } from '@scalar/components'
import { ScalarIconMagnifyingGlass } from '@scalar/icons'
import {
  ScalarSidebar,
  type DraggingItem,
  type HoveredItem,
  type SidebarState,
} from '@scalar/sidebar'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import type { WorkspaceDocument } from '@scalar/workspace-store/schemas'
import type { TraversedEntry } from '@scalar/workspace-store/schemas/navigation'
import { ref } from 'vue'

import { Resize } from '@/v2/components/resize'
import { SearchButton } from '@/v2/features/search'
import type { Workspace } from '@/v2/hooks/use-workspace-selector'
import type { ClientLayout } from '@/v2/types/layout'

import SidebarMenu from './SidebarMenu.vue'
import SidebarToggle from './SidebarToggle.vue'

const { sidebarState, layout } = defineProps<{
  /** All documents to display sidebar items for */
  sidebarState: SidebarState<TraversedEntry>
  /** Layout for the client */
  layout: ClientLayout
  /** The currently active workspace */
  activeWorkspace: Workspace
  /** The list of all available workspaces */
  workspaces: Workspace[]
  /** The workspace event bus for handling workspace-level events */
  eventBus: WorkspaceEventBus
  /** The documents belonging to the workspace */
  documents: WorkspaceDocument[]
  /**
   * Prevents sidebar items from being hovered and dropped into. Can be either a function or a boolean
   *
   * @default true
   */
  isDroppable?:
    | boolean
    | ((draggingItem: DraggingItem, hoveredItem: HoveredItem) => boolean)
}>()

const emit = defineEmits<{
  /** Emitted when an item is selected */
  (e: 'selectItem', id: string): void
  /** Emitted when a workspace is selected by optional ID */
  (e: 'select:workspace', id?: string): void
  /** Emitted when the user wants to create a new workspace */
  (e: 'create:workspace'): void
  /** Emitted when sidebar items are reordered via drag and drop */
  (e: 'reorder', draggingItem: DraggingItem, hoveredItem: HoveredItem): void
}>()

defineSlots<{
  /** Slot to add the workspace button */
  workspaceButton?(): unknown
  /** Slot to add additional content to the footer */
  footer?(): unknown
}>()

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
        :indent="15"
        :isDroppable="isDroppable"
        :isExpanded="sidebarState.isExpanded"
        :isSelected="sidebarState.isSelected"
        :items="sidebarState.items.value"
        layout="client"
        @reorder="
          (draggingItem, hoveredItem) =>
            emit('reorder', draggingItem, hoveredItem)
        "
        @selectItem="(id) => emit('selectItem', id)">
        <template #header>
          <div class="bg-sidebar-b-1 z-1 flex flex-col gap-1.5 px-3 pb-1.5">
            <div class="flex items-center justify-between">
              <!-- Desktop gets the workspace menu here  -->
              <SidebarMenu
                v-if="layout === 'desktop'"
                :activeWorkspace="activeWorkspace"
                :workspaces="workspaces"
                @create:workspace="emit('create:workspace')"
                @select:workspace="(id) => emit('select:workspace', id)" />

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

            <SearchButton
              v-if="isSearchVisible || layout === 'web'"
              :documents="documents"
              :eventBus="eventBus" />
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
