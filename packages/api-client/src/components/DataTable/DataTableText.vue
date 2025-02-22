<script setup lang="ts">
import DataTableCell from './DataTableCell.vue'

defineProps<{
  text?: string | number
}>()
</script>
<template>
  <DataTableCell class="relative flex">
    <span class="flex-1 whitespace-nowrap px-2 py-1.5">
      <slot>{{ text }}</slot>
    </span>
  </DataTableCell>
</template>
