<script setup lang="ts">
import AddressBar from '@/components/AddressBar/AddressBar.vue'
import EnvironmentSelector from '@/components/EnvironmentSelector/EnvironmentSelector.vue'
import SidebarToggle from '@/components/Sidebar/SidebarToggle.vue'
import { ScalarIcon } from '@scalar/components'

import { WorkspaceDropdown } from './components'

defineProps<{
  modelValue: boolean
  isReadonly: boolean
}>()

defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'hideModal'): void
  (e: 'importCurl', value: string): void
}>()
</script>
<template>
  <div
    class="lg:min-h-header flex items-center w-full justify-center p-2 pt-1 lg:p-1 flex-wrap t-app__top-container md:border-b-1/2">
    <div
      class="flex flex-row items-center gap-1 lg:px-1 lg:mb-0 mb-0.5 lg:flex-1 w-6/12">
      <SidebarToggle
        class="gitbook-hidden"
        :modelValue="modelValue"
        @update:modelValue="$emit('update:modelValue', $event)" />
      <WorkspaceDropdown v-if="!isReadonly" />
      <a
        class="text-c-2 text-sm font-medium gitbook-show ml-.5 hover:text-c-1 border p-1 rounded hover:bg-b-3"
        href="https://scalar.com/"
        target="_blank">
        Powered by Scalar.com
      </a>
    </div>
    <AddressBar @importCurl="$emit('importCurl', $event)" />
    <div
      class="flex flex-row items-center gap-1 lg:px-2.5 lg:mb-0 mb-0.5 lg:flex-1 justify-end w-6/12">
      <EnvironmentSelector v-if="!isReadonly" />
      <!-- TODO: There should be an `ìsModal` flag instead -->
      <button
        v-if="isReadonly"
        class="text-c-1 hover:bg-b-2 active:text-c-1 p-2 rounded -mr-1.5"
        type="button"
        @click="$emit('hideModal')">
        <ScalarIcon
          icon="Close"
          size="md"
          thickness="1.75" />
      </button>
    </div>
  </div>
</template>
<style scoped>
.gitbook-show {
  display: none;
}
</style>
