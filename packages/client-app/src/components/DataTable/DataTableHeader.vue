<script setup lang="ts">
import DataTableCell from './DataTableCell.vue'
</script>
<template>
  <DataTableCell
    is="th"
    class="truncate">
    <slot />
  </DataTableCell>
</template>
