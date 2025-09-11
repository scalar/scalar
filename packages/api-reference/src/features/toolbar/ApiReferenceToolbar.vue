<script lang="ts" setup>
import { computed } from 'vue'

defineProps<{
  store?: any
}>()

const showToolbar = computed<boolean>(() => {
  if (!window) {
    return false
  }
  return window.location.hostname === 'localhost'
})
</script>
<template>
  <header
    v-if="showToolbar"
    class="api-reference-toolbar h-header bg-b-1 sticky top-0 z-10 flex items-center justify-center border-b">
    Dev Toolbar
  </header>
</template>
