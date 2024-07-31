<script lang="ts" setup>
defineProps<{
  type: string
}>()
</script>
<template>
  <div class="border-1/2 flex justify-center rounded p-2">
    <div class="text-c-3 p-2 text-sm">Binary file ({{ type }})</div>
    <slot />
  </div>
</template>
