<script setup lang="ts">
/**
 * Document page
 *
 * This component represents the main document page where users can view and edit document details.
 * It includes features such as selecting document icons, editing document titles, and navigating through different tabs
 * like Overview, Servers, Authentication, Environment, and Settings.
 *
 * Props:
 * - selectedTab: The currently selected tab (default is 'overview').
 * - icon: The icon representing the document (default is 'interface-content-folder').
 * - title: The title of the document.
 */
import { ScalarButton } from '@scalar/components'
import { LibraryIcon } from '@scalar/icons/library'

import LabelInput from '@/components/Form/LabelInput.vue'
import IconSelector from '@/components/IconSelector.vue'
import Overview from '@/v2/features/document/components/Overview.vue'

import Authentication from './components/Authentication.vue'
import Environment from './components/Environment.vue'
import Servers from './components/Servers.vue'
import Settings from './components/Settings.vue'
import Tabs, { type Routes } from './components/Tabs.vue'

const {
  selectedTab = 'settings',
  title = 'Document Name',
  icon = 'interface-content-folder',
} = defineProps<{
  /** Currently selected tab */
  selectedTab: Routes
  /** Document icon */
  icon?: string
  /** Document title */
  title: string
  /** Document source url if available */
  documentUrl?: string
  /** Watch mode status if also document url is provided */
  watchMode?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:selectedTab', value: Routes): void
  (e: 'update:documentTitle', value: string): void
  (e: 'update:documentIcon', value: string): void

  // Document settings
  (e: 'settings:deleteDocument'): void
  (e: 'settings:update:watchMode', value: boolean): void
}>()
</script>

<template>
  <div class="w-full md:mx-auto md:max-w-[720px]">
    <!-- Document title and icon -->
    <div
      :aria-label="`Document: ${title}`"
      class="mx-auto flex h-fit w-full flex-col gap-2 pt-6 pb-3 md:mx-auto md:max-w-[720px]">
      <IconSelector
        :modelValue="icon"
        placement="bottom-start"
        @update:modelValue="(value) => emit('update:documentIcon', value)">
        <ScalarButton
          class="hover:bg-b-2 aspect-square h-7 w-7 cursor-pointer rounded border border-transparent p-0 hover:border-inherit"
          variant="ghost">
          <LibraryIcon
            class="text-c-2 size-5"
            :src="icon"
            stroke-width="2" />
        </ScalarButton>
      </IconSelector>
      <div class="group relative ml-1.25">
        <LabelInput
          class="text-xl font-bold"
          inputId="documentName"
          placeholder="Untitled Document"
          :value="title"
          @updateValue="(value) => emit('update:documentTitle', value)" />
      </div>
    </div>
    <!-- Tabs -->
    <Tabs
      :selectedTab="selectedTab"
      @update:selectedTab="(tab) => emit('update:selectedTab', tab)" />
    <!-- Tab views -->
    <Overview v-if="selectedTab === 'overview'" />
    <Servers v-else-if="selectedTab === 'servers'" />
    <Authentication v-else-if="selectedTab === 'authentication'" />
    <Environment v-else-if="selectedTab === 'environment'" />
    <Settings
      v-else-if="selectedTab === 'settings'"
      :documentUrl="documentUrl"
      :title="title"
      :watchMode="watchMode"
      @deleteDocument="emit('settings:deleteDocument')"
      @update:watchMode="(value) => emit('settings:update:watchMode', value)" />
    <!-- Tab views end -->
  </div>
</template>
