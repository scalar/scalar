<script setup lang="ts">
import { ScalarIcon } from '@scalar/components'

const emit = defineEmits<{
  (e: 'openSearchModal'): void
}>()
</script>
<template>
  <div class="search-button-fade sticky top-0 z-50 px-3 py-2.5 pb-2.5">
    <button
      class="border-1/2 text-c-2 flex w-full items-center rounded p-1.5"
      type="button"
      @click="emit('openSearchModal')">
      <div class="w-[15px] flex items-center justify-center">
        <ScalarIcon
          icon="Search"
          size="xs"
          thickness="2.5" />
      </div>
      <div
        class="sidebar-search-input ml-1.5 flex w-full items-center justify-between text-sm font-medium">
        <span class="sidebar-search-placeholder">Search</span>
      </div>
    </button>
  </div>
</template>
<style scoped>
.search-button-fade {
  background: linear-gradient(
    var(--scalar-background-1) 44px,
    color-mix(in srgb, var(--scalar-background-1), transparent) 50px,
    transparent
  );
}
</style>
