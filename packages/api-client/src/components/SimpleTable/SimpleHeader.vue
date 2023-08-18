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
  color: var(--scalar-api-client-text-color-muted);
  font-weight: var(--scalar-api-client-font-bold);
  text-transform: uppercase;
}
</style>
