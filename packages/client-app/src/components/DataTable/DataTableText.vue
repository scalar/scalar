<script setup lang="ts">
import DataTableCell from './DataTableCell.vue'

defineProps<{
  text: string | number
}>()
</script>
<template>
  <DataTableCell class="relative flex">
    <span
      class="text-c-2 focus:text-c-1 min-w-0 flex-1 px-2 py-[5.75px] whitespace-nowrap">
      {{ text }}
    </span>
  </DataTableCell>
</template>
