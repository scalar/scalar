<script setup lang="ts">
import DataTableCell from './DataTableCell.vue'

defineProps<{
  text: string | number
}>()
</script>
<template>
  <DataTableCell class="relative flex">
    <span
      class="min-w-0 flex-1 px-2 py-[5.75px] whitespace-nowrap overflow-x-auto overflow-y-hidden custom-scroll">
      {{ text }}
    </span>
  </DataTableCell>
</template>
