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
import { ScalarIcon } from '@scalar/components'
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
    <!-- Render tabs using the DesktopTab component -->
    <DesktopTab
      v-for="(tab, index) in tabs"
      :key="index"
      :active="index === activeTabIndex"
      :hotkey="tabs.length > 1 && index < 9 ? String(index + 1) : undefined"
      :isSingleTab="tabs.length === 1"
      :tab="tab"
      @click="switchTab(index)"
      @close="handleCloseTab(index)"
      @closeOtherTabs="handleCloseOtherTabs(index)"
      @copyUrl="copyTabUrl(index)"
      @newTab="handleAddTab" />

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
