<script setup lang="ts">
defineProps<{
  showEmptyState: boolean
}>()
</script>
<template>
  <!-- Empty State -->
  <slot
    v-if="showEmptyState"
    name="empty-state" />

  <!-- Introduction -->
  <slot
    v-else
    name="default" />
</template>
