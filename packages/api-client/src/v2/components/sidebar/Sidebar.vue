<script setup lang="ts">
import { ScalarIconButton, ScalarSidebarSearchInput } from '@scalar/components'
import { ScalarIconMagnifyingGlass } from '@scalar/icons'
import { createSidebarState, ScalarSidebar, type Item } from '@scalar/sidebar'
import type { WorkspaceDocument } from '@scalar/workspace-store/schemas/workspace'
import { computed, ref } from 'vue'

import { Resize } from '@/v2/components/resize'
import type { ClientLayout } from '@/v2/types/layout'

import SidebarMenu from './SidebarMenu.vue'
import SidebarToggle from './SidebarToggle.vue'

const { documents, layout } = defineProps<{
  /** All documents to display sidebar items for */
  documents: Record<string, WorkspaceDocument>
  /** Layout for the client */
  layout: ClientLayout
}>()

defineSlots<{
  /** Slot to add the workspace button */
  workspaceButton?(): unknown
  /** Slot to add additional content to the footer */
  footer?(): unknown
}>()

/** Generate the sidebar state based on the current workspace */
const sidebarState = computed(() => {
  const documentEntries: Item[] = Object.entries(documents).map(
    ([name, doc]) => ({
      id: name,
      type: 'document',
      title: doc.info.title ?? name,
      children: doc['x-scalar-navigation'] ?? [],
    }),
  )

  return createSidebarState(documentEntries)
})

const log = (name: string, ...args: any[]) => {
  console.log('[LOG] event name: ', name)
  console.log('[LOG]', ...args)
}

/** Propagate up the workspace model to the parent */
const workspaceModel = defineModel<string>('workspace', {
  required: true,
  default: 'default',
})

/** Controls the visibility of the sidebar */
const isSidebarOpen = defineModel<boolean>('isSidebarOpen', {
  required: true,
})

/** Controls the visibility of the search input */
const isSearchVisible = ref(false)

/** Controls the width of the sidebar */
const sidebarWidth = ref(288)
</script>
<template>
  <Resize
    v-model:width="sidebarWidth"
    class="flex flex-col">
    <template #default>
      <ScalarSidebar
        class="flex w-auto flex-1"
        layout="client"
        :state="sidebarState"
        @reorder="(...args) => log('reorder', ...args)">
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
                v-else
                v-model="isSidebarOpen" />

              <!-- Toggle search -->
              <ScalarIconButton
                :icon="ScalarIconMagnifyingGlass"
                label="Search"
                @click="isSearchVisible = !isSearchVisible" />
            </div>

            <!-- Search input -->
            <ScalarSidebarSearchInput
              v-if="isSearchVisible"
              autofocus />
          </div>
        </template>

        <template #firstItem>
          <slot name="workspaceButton" />
        </template>

        <template #footer>
          <slot name="footer" />
        </template>
      </ScalarSidebar>
    </template>
  </Resize>
</template>
