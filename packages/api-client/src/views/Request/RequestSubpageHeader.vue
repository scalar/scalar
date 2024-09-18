<script setup lang="ts">
import AddressBar from '@/components/AddressBar/AddressBar.vue'
import EnvironmentSelector from '@/components/EnvironmentSelector/EnvironmentSelector.vue'
import SidebarToggle from '@/components/Sidebar/SidebarToggle.vue'
import { ScalarIcon } from '@scalar/components'

defineProps<{
  modelValue: boolean
  isReadonly: boolean
}>()

defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'hideModal'): void
}>()
</script>
<template>
  <div
    class="lg:min-h-header flex items-center w-full justify-center p-1 flex-wrap t-app__top-container border-b-1/2">
    <div
      class="flex flex-row items-center gap-1 lg:px-1 lg:mb-0 mb-0.5 lg:flex-1 w-6/12">
      <SidebarToggle
        class="gitbook-hidden"
        :modelValue="modelValue"
        @update:modelValue="$emit('update:modelValue', $event)" />
      <a
        class="text-c-2 text-sm font-medium gitbook-show ml-.5 hover:text-c-1 border p-1 rounded hover:bg-b-3"
        href="https://scalar.com/"
        target="_blank">
        Powered by Scalar.com
      </a>
    </div>
    <AddressBar />
    <div
      class="flex flex-row items-center gap-1 lg:px-1 lg:mb-0 mb-0.5 lg:flex-1 justify-end w-6/12">
      <EnvironmentSelector v-if="!isReadonly" />
      <!-- TODO: There should be an `ìsModal` flag instead -->
      <button
        v-if="isReadonly"
        class="text-c-3 hover:bg-b-2 active:text-c-1 p-2 rounded"
        type="button"
        @click="$emit('hideModal')">
        <ScalarIcon
          icon="Close"
          size="lg"
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
