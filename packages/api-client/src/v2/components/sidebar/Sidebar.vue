<script setup lang="ts">
import {
  ScalarIconButton,
  ScalarSidebarSearchInput,
  type WorkspaceGroup,
} from '@scalar/components'
import { ScalarIconFileDashed, ScalarIconMagnifyingGlass } from '@scalar/icons'
import {
  ScalarSidebar,
  type DraggingItem,
  type HoveredItem,
  type SidebarState,
} from '@scalar/sidebar'
import type { WorkspaceDocument } from '@scalar/workspace-store/schemas'
import type { TraversedEntry } from '@scalar/workspace-store/schemas/navigation'
import { computed, ref } from 'vue'

import { Resize } from '@/v2/components/resize'
import { useSearchIndex } from '@/v2/features/search'
import type { ClientLayout } from '@/v2/types/layout'

import SidebarMenu from './SidebarMenu.vue'

const { documents, sidebarState, layout } = defineProps<{
  /** All documents to display sidebar items for */
  sidebarState: SidebarState<TraversedEntry>
  /** Layout for the client */
  layout: ClientLayout
  /** The currently active workspace */
  activeWorkspace: { id: string }
  /** The list of all available workspaces */
  workspaces: WorkspaceGroup[]
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

const slots = defineSlots<{
  /** Slot to add the workspace button */
  workspaceButton?(): unknown
  /** Slot to add additional content to the decorator */
  decorator?(props: { item: TraversedEntry }): unknown
  /** Slot to add additional content to the footer */
  footer?(): unknown
  /** Slot to add additional content to the empty folder */
  empty?(props: { item: TraversedEntry }): unknown
  /** Slot for customizing the actions section of the sidebar menu. */
  sidebarMenuActions?(): unknown
  /** Slot to add additional content to the icon */
  icon?(props: { item: TraversedEntry; open: boolean }): unknown
}>()

/** Controls the visibility of the search input */
const isSearchVisible = ref(false)

/** Controls the width of the sidebar */
const sidebarWidth = defineModel<number>('sidebarWidth', {
  required: true,
  default: 288,
})

const isDraft = (item: TraversedEntry) => {
  return item.type === 'example' && item.title === 'draft'
}

/** We handle search results out here so we can show them in the sidebar */
const { query, results } = useSearchIndex(() => documents)

/** We show either the search results or the sidebar items */
const items = computed(() => results.value ?? sidebarState.items.value)

/** Select an item and clear the search query */
const handleSelectItem = (id: string) => {
  emit('selectItem', id)
  query.value = ''
  isSearchVisible.value = false
}
</script>
<template>
  <Resize
    v-model:width="sidebarWidth"
    class="flex flex-col">
    <template #default>
      <ScalarSidebar
        class="flex w-auto flex-1 pt-2"
        :indent="15"
        :isDraggable="layout !== 'modal'"
        :isDroppable="isDroppable"
        :isExpanded="sidebarState.isExpanded"
        :isSelected="sidebarState.isSelected"
        :items
        layout="client"
        @reorder="
          (draggingItem, hoveredItem) =>
            emit('reorder', draggingItem, hoveredItem)
        "
        @selectItem="handleSelectItem">
        <template #header>
          <div class="bg-sidebar-b-1 z-1 flex flex-col gap-1.5 px-3 pb-1.5">
            <div class="flex items-center justify-between">
              <!-- Desktop gets the workspace menu here  -->
              <SidebarMenu
                v-if="layout === 'desktop'"
                :activeWorkspace="activeWorkspace"
                :workspaces="workspaces"
                @create:workspace="emit('create:workspace')"
                @select:workspace="(id) => emit('select:workspace', id)">
                <template #sidebarMenuActions>
                  <slot name="sidebarMenuActions" />
                </template>
              </SidebarMenu>

              <!-- Placeholder for the sidebar toggle in modal layout -->
              <div v-else-if="layout === 'modal'"></div>

              <!-- Toggle search, always visible on web -->
              <ScalarIconButton
                v-if="layout !== 'web'"
                :icon="ScalarIconMagnifyingGlass"
                label="Search"
                @click="isSearchVisible = !isSearchVisible" />
            </div>

            <ScalarSidebarSearchInput
              v-if="isSearchVisible || layout === 'web'"
              v-model="query"
              :autofocus="layout !== 'web'" />
          </div>
        </template>

        <template #decorator="decoratorProps">
          <slot
            v-bind="decoratorProps"
            name="decorator" />
        </template>

        <template #icon="iconProps">
          <template v-if="slots.icon || isDraft(iconProps.item)">
            <ScalarIconFileDashed v-if="isDraft(iconProps.item)" />
            <slot
              v-bind="iconProps"
              name="icon" />
          </template>
        </template>

        <!-- Empty folder slot -->
        <template
          v-if="slots.empty"
          #empty="emptyProps">
          <slot
            v-bind="emptyProps"
            name="empty" />
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
