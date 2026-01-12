<script setup lang="ts">
import { ScalarIcon } from '@scalar/components'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import type { Tab } from '@scalar/workspace-store/schemas/extensions/workspace/x-scalar-tabs'
import { computed } from 'vue'

import DesktopTab from '@/v2/features/app/components/DesktopTab.vue'

const { tabs, eventBus } = defineProps<{
  /** Tabs state */
  tabs: Tab[]
  /** Current active tab index */
  activeTabIndex: number
  /** Workspace event bus for emitting tab-related events */
  eventBus: WorkspaceEventBus
}>()

/** Whether there is only a single tab open */
const isSingleTab = computed((): boolean => tabs.length === 1)

/** Adds a new tab */
const handleAddTab = (): void => {
  eventBus.emit('tabs:add:tab', undefined)
}

/** Switches to the tab at the specified index */
const switchTab = (index: number): void => {
  eventBus.emit('tabs:focus:tab', { index })
}

/** Closes the tab at the specified index */
const handleCloseTab = (index: number): void => {
  eventBus.emit('tabs:close:tab', { index })
}

/** Closes all tabs except the one at the specified index */
const handleCloseOtherTabs = (index: number): void => {
  eventBus.emit('tabs:close:other-tabs', { index })
}

const handleCopyTabUrl = (index: number): void => {
  eventBus.emit('tabs:copy:url', { index })
}
</script>

<template>
  <nav class="mac:pl-[72px] t-app__top-nav flex h-10 items-center gap-2 px-2">
    <DesktopTab
      v-for="(tab, index) in tabs"
      :key="index"
      :active="index === activeTabIndex"
      :hotkey="!isSingleTab && index < 9 ? String(index + 1) : undefined"
      :isSingleTab="isSingleTab"
      :tab="tab"
      @click="switchTab(index)"
      @close="handleCloseTab(index)"
      @closeOtherTabs="handleCloseOtherTabs(index)"
      @copyUrl="() => handleCopyTabUrl(index)"
      @newTab="handleAddTab" />

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
