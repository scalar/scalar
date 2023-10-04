<script lang="ts" setup>
import SimpleCell from './SimpleCell.vue'
</script>
<template>
  <SimpleCell
    as="th"
    class="simple-header">
    <slot />
  </SimpleCell>
</template>
<style scoped>
.simple-header {
  color: var(--theme-color-3, var(--default-theme-color-3));
  font-weight: var(--theme-bold, var(--default-theme-bold));
  text-transform: uppercase;
}
</style>
