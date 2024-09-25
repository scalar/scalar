<script setup lang="ts">
defineProps<{
  method: string
  name: string
}>()
</script>

<template>
  <div
    class="inline-flex items-center gap-2 text-green py-2 px-3 text-sm font-bold rounded whitespace-nowrap"
    style="background-color: rgba(0, 182, 72, 0.1)">
    <div class="text-xs">{{ method }}</div>
    <div>{{ name }}</div>
  </div>
</template>
