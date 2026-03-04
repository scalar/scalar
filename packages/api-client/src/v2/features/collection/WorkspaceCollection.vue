<script lang="ts">
/** Document collection page — tabs for Overview, Servers, Auth, Environment, Cookies, and Settings. */
export default {}
</script>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { RouterView } from 'vue-router'

import type { RouteProps } from '@/v2/features/app/helpers/routes'
import LabelInput from '@/v2/features/collection/components/LabelInput.vue'

import Tabs from './components/Tabs.vue'

const props = defineProps<RouteProps>()

/**
 * Local copy of the label so we can reset on empty-blur rejection and stay in
 * sync when Vue Router reuses this component across workspace navigations.
 */
const workspaceTitle = ref(props.activeWorkspace.label)

watch(
  () => props.activeWorkspace.label,
  (newLabel) => {
    workspaceTitle.value = newLabel
  },
)

/** Emits the rename event on blur, or resets the input if the title is blank. */
const handleUpdateWorkspaceTitle = (title: string) => {
  if (title.trim() === '') {
    // Force defineModel inside LabelInput to re-sync to the original value.
    workspaceTitle.value = props.activeWorkspace.label
    return
  }
  props.eventBus.emit('workspace:update:name', title)
}
</script>

<template>
  <div class="custom-scroll h-full">
    <div class="w-full px-3 md:mx-auto md:max-w-180">
      <!-- Header -->
      <div
        :aria-label="`title: ${activeWorkspace.label}`"
        class="mx-auto flex h-fit w-full flex-row items-center gap-2 pt-14 pb-3 md:max-w-180 md:pt-6">
        <div class="group relative ml-1.25">
          <LabelInput
            v-model="workspaceTitle"
            class="text-xl font-bold"
            inputId="workspaceName"
            placeholder="Untitled Workspace"
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
