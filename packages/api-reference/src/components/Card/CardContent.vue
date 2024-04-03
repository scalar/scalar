<script setup lang="ts">
import { type CardContentProps } from './types'

defineProps<CardContentProps>()
</script>
<template>
  <div
    class="scalar-card-content"
    :class="{
      'scalar-card--muted': muted,
      'scalar-card--contrast': contrast,
      'scalar-card--frameless': frameless,
      'scalar-card--transparent': transparent,
      'scalar-card--borderless': borderless,
    }">
    <slot />
  </div>
</template>
<style scoped>
.scalar-card-content {
  overflow: auto;
  border-bottom: 1px solid var(--scalar-border-color);
}
.scalar-card-content :deep(.simple-table .simple-header) {
  display: none;
}
.scalar-card-content:last-of-type,
.scalar-card-content.scalar-card--borderless {
  border-bottom: none;
}
.scalar-card--muted {
  background: var(--scalar-background-2);
}
.scalar-card--contrast {
  background: var(--scalar-background-3);
}
.scalar-card--frameless {
  padding: 0;
}
.scalar-card--transparent {
  background: var(--scalar-background-1);
}
</style>
