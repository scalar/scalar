<script lang="ts" setup>
import CardContent from './CardContent.vue'
</script>
<template>
  <CardContent class="card-header">
    <slot />
  </CardContent>
</template>
<style scoped>
.card-header {
  padding: 9px 12px;
  font-weight: var(--theme-semibold);
  font-size: var(--theme-mini);
  color: var(--theme-color-3);
  text-transform: uppercase;
}
</style>
