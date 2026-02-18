<script lang="ts">
/**
 * Document Collection Page
 *
 * Displays primary document editing and viewing interface, enabling users navigate among
 * Overview, Servers, Authentication, Environment, Cookies, and Settings tabs
 */
export default {}
</script>

<script setup lang="ts">
import { RouterView } from 'vue-router'

import type { RouteProps } from '@/v2/features/app/helpers/routes'
import LabelInput from '@/v2/features/collection/components/LabelInput.vue'

import Tabs from './components/Tabs.vue'

const props = defineProps<RouteProps>()

/**
 * Handles updating the workspace title when the input loses focus.
 * Emits 'workspace:update:name' event only if the trimmed title is not empty.
 */
const handleUpdateWorkspaceTitle = (title: string) => {
  if (title.trim() === '') {
    return
  }
  props.eventBus.emit('workspace:update:name', title)
}
</script>

<template>
  <div class="custom-scroll h-full">
    <div class="w-full md:mx-auto md:max-w-180">
      <!-- Header -->
      <div
        :aria-label="`title: ${activeWorkspace.label}`"
        class="mx-auto flex h-fit w-full flex-row items-center gap-2 pt-8 pb-3 md:max-w-180">
        <div class="group relative ml-1.25">
          <LabelInput
            class="text-xl font-bold"
            inputId="workspaceName"
            :modelValue="activeWorkspace.label"
            @blur="handleUpdateWorkspaceTitle" />
        </div>
      </div>

      <!-- Tabs -->
      <Tabs type="workspace" />

      <!-- Router views -->
      <div class="px-1.5 py-8">
        <RouterView
          v-bind="props"
          collectionType="workspace" />
      </div>
    </div>
  </div>
</template>
