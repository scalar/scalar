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
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import type { XScalarTabs } from '@scalar/workspace-store/schemas/extensions/workspace/x-sclar-tabs'

import DesktopTab from '@/v2/features/app/components/DesktopTab.vue'

const { tabs, activeTabIndex, eventBus, copyTabUrl } = defineProps<{
  /** Array of tab paths */
  tabs: NonNullable<XScalarTabs['x-scalar-tabs']>
  /** Index of the active tab */
  activeTabIndex: number
  /** Function to copy the URL of a tab */
  copyTabUrl: (index: number) => void
  /** Worksapce event bus */
  eventBus: WorkspaceEventBus
}>()

/**
 * Add a new tab based on the current active tab's context.
 * Extracts the workspace path from the current tab and creates a new tab there.
 */
const handleAddTab = (): void => {
  eventBus.emit('tabs:add:tab', undefined)
}

const switchTab = (index: number): void => {
  eventBus.emit('tabs:focus:tab', { index })
}

const handleCloseTab = (index: number): void => {
  eventBus.emit('tabs:close:tab', { index })
}

const handleCloseOtherTabs = (index: number): void => {
  eventBus.emit('tabs:close:other-tabs', { index })
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
              v-if="tabs[activeTabIndex]?.icon"
              class="text-c-2 size-5"
              :src="tabs[activeTabIndex].icon"
              stroke-width="2" />
            <span>{{ tabs[activeTabIndex]?.title ?? 'Workspace' }}</span>
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
                    @click="copyTabUrl(activeTabIndex)">
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
        :active="index === activeTabIndex"
        :hotkey="index < 9 ? String(index + 1) : undefined"
        :tab="tab"
        @click="switchTab(index)"
        @close="handleCloseTab(index)"
        @closeOtherTabs="handleCloseOtherTabs(index)"
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
