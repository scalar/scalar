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
  font-weight: var(--scalar-api-reference-theme-semibold);
  font-size: var(--scalar-api-reference-theme-mini);
  color: var(--scalar-api-reference-theme-color-3);
  text-transform: uppercase;
}
</style>
