<script setup lang="ts">
import DataTableCell from './DataTableCell.vue'

defineProps<{
  text: string | number
}>()
</script>
<template>
  <DataTableCell class="relative flex">
    <span class="flex-1 px-2 py-[5.75px] whitespace-nowrap truncate">
      {{ text }}
    </span>
  </DataTableCell>
</template>
