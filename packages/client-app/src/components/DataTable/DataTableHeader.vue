<script setup lang="ts">
import DataTableCell from './DataTableCell.vue'
</script>
<template>
  <DataTableCell
    is="th"
    class="truncate font-medium px-2 py-1.5">
    <slot />
  </DataTableCell>
</template>
