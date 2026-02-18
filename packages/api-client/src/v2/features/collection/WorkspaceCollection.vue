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
import { ref } from 'vue'
import { RouterView } from 'vue-router'

import type { RouteProps } from '@/v2/features/app/helpers/routes'
import LabelInput from '@/v2/features/collection/components/LabelInput.vue'

import Tabs from './components/Tabs.vue'

const props = defineProps<RouteProps>()

/**
 * Local copy of the workspace label so we can reset it when an empty-title
 * blur is rejected.  Without this, defineModel inside LabelInput holds a
 * stale empty string because the parent prop never changed.
 */
const workspaceTitle = ref(props.activeWorkspace.label)

/**
 * Handles updating the workspace title when the input loses focus.
 * Emits 'workspace:update:name' event only if the trimmed title is not empty.
 * Resets the local ref to the current label so the input is not left blank.
 */
const handleUpdateWorkspaceTitle = (title: string) => {
  if (title.trim() === '') {
    // Reset the local ref so defineModel inside LabelInput re-syncs to the
    // original value instead of staying permanently empty.
    workspaceTitle.value = props.activeWorkspace.label
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
            v-model="workspaceTitle"
            class="text-xl font-bold"
            inputId="workspaceName"
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
