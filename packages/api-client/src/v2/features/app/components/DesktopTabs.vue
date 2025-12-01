<script lang="ts">
/**
 * Tabs which only exist on the electron app.
 *
 * Displays all open tabs, allows switching between them, closing them,
 * and performing other tab-related actions through the context menu.
 */
export default {
  name: 'DesktopTabs',
}
</script>

<script setup lang="ts">
import {
  ScalarContextMenu,
  ScalarDropdownButton,
  ScalarDropdownMenu,
  ScalarFloating,
  ScalarHotkey,
  ScalarIcon,
} from '@scalar/components'
import { LibraryIcon } from '@scalar/icons/library'
import type { SidebarState } from '@scalar/sidebar'
import type { XScalarTabs } from '@scalar/workspace-store/schemas/extensions/workspace/x-sclar-tabs'
import type { TraversedEntry } from '@scalar/workspace-store/schemas/navigation'
import { computed } from 'vue'

import DesktopTab from '@/v2/features/app/components/DesktopTab.vue'

const {
  tabs,
  activeTab,
  addTab,
  switchTab,
  closeTab,
  closeOtherTabs,
  copyTabUrl,
  sidebarState,
} = defineProps<{
  /** Array of tab paths */
  tabs: NonNullable<XScalarTabs['x-scalar-tabs']>
  /** Index of the currently active tab */
  activeTab: NonNullable<XScalarTabs['x-scalar-active-tab']>
  /** Add a new tab with the given path */
  addTab: (path: string) => void
  /** Switch to the tab at the given index */
  switchTab: (index: number) => void
  /** Close the tab at the given index */
  closeTab: (index: number) => void
  /** Close all tabs except the one at the given index */
  closeOtherTabs: (index: number) => void
  /** Copy the URL of the tab at the given index */
  copyTabUrl: (index: number) => void
  /** The sidebar state, holding navigation items and state */
  sidebarState: SidebarState<TraversedEntry>
}>()

/**
 * Add a new tab based on the current active tab's context.
 * Extracts the workspace path from the current tab and creates a new tab there.
 */
const handleAddTab = (): void => {
  const currentTab = tabs[activeTab]

  if (!currentTab) {
    // Fallback to root path if no current tab
    addTab('/')
    return
  }

  addTab(currentTab.path)
}
</script>

<template>
  <!-- Navigation bar containing all desktop tabs -->
  <nav class="flex h-10 items-center gap-2 px-2">
    <!-- When there's only one tab, show it as a simple header without tab styling -->
    <template v-if="tabs.length === 1">
      <div class="h-full w-full overflow-hidden">
        <ScalarContextMenu
          triggerClass="flex custom-scroll gap-1.5 h-full items-center justify-center w-full whitespace-nowrap">
          <template #trigger>
            <LibraryIcon
              v-if="tabs[activeTab]?.icon"
              class="text-c-2 size-5"
              :src="tabs[activeTab]?.icon"
              stroke-width="2" />
            <span>{{ tabs[activeTab]?.title ?? 'Workspace' }}</span>
          </template>
          <template #content>
            <ScalarFloating placement="right-start">
              <template #floating>
                <ScalarDropdownMenu class="scalar-app scalar-client">
                  <ScalarDropdownButton
                    class="flex items-center gap-1.5"
                    @click="handleAddTab">
                    <ScalarIcon
                      icon="AddTab"
                      size="sm"
                      thickness="1.5" />
                    New Tab
                    <ScalarHotkey
                      class="bg-b-2 ml-auto"
                      hotkey="T" />
                  </ScalarDropdownButton>
                  <ScalarDropdownButton
                    class="flex items-center gap-1.5"
                    @click="copyTabUrl(activeTab)">
                    <ScalarIcon
                      icon="Link"
                      size="sm"
                      thickness="1.5" />
                    Copy URL
                  </ScalarDropdownButton>
                </ScalarDropdownMenu>
              </template>
            </ScalarFloating>
          </template>
        </ScalarContextMenu>
      </div>
    </template>

    <!-- When there are multiple tabs, render them as tabs -->
    <template v-else>
      <DesktopTab
        v-for="(tab, index) in tabs"
        :key="index"
        :active="index === activeTab"
        :hotkey="index < 9 ? String(index + 1) : undefined"
        :tab="tab"
        @click="switchTab(index)"
        @close="closeTab(index)"
        @closeOtherTabs="closeOtherTabs(index)"
        @copyUrl="copyTabUrl(index)"
        @newTab="handleAddTab" />
    </template>

    <!-- Add new tab button -->
    <button
      class="text-c-3 hover:bg-b-3 app-no-drag-region rounded p-1.5"
      type="button"
      @click="handleAddTab">
      <ScalarIcon
        icon="Add"
        size="sm"
        thickness="2.5" />
    </button>
  </nav>
</template>
