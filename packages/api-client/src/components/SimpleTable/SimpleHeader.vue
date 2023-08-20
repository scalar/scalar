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
<style>
.simple-header {
  color: var(--theme-color-disabled);
  font-weight: var(--theme-bold);
  text-transform: uppercase;
}
</style>
