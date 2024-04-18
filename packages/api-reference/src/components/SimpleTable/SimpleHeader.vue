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
  color: var(--scalar-color-3);
  font-weight: var(--scalar-semibold);
  text-transform: uppercase;
}
</style>
