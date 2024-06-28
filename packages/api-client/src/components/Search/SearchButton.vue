<script setup lang="ts">
import ScalarHotkey from '@/components/ScalarHotkey.vue'
import { ScalarIcon } from '@scalar/components'

const emit = defineEmits<{
  (e: 'openSearchModal'): void
}>()
</script>
<template>
  <div class="bg-b-1 sticky top-0 z-50 px-3 py-2.5 pb-0">
    <button
      class="shadow-border text-c-2 flex w-full items-center rounded p-1.5"
      type="button"
      @click="emit('openSearchModal')">
      <div class="w-[15px] flex items-center justify-center">
        <ScalarIcon
          icon="Search"
          size="xs" />
      </div>
      <div
        class="sidebar-search-input ml-1.5 flex w-full items-center justify-between text-sm font-medium">
        <span class="sidebar-search-placeholder">Search</span>
        <ScalarHotkey hotkey="k" />
      </div>
    </button>
  </div>
</template>
