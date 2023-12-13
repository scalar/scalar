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
  border-bottom: 1px solid
    var(--theme-border-color, var(--default-theme-border-color));
}
.scalar-card-content :deep(.simple-table .simple-header) {
  display: none;
}
.scalar-card-content:last-of-type,
.scalar-card-content.scalar-card--borderless {
  border-bottom: none;
}

.scalar-card-content.scalar-card--borderless {
  padding-bottom: 0;
}

.scalar-card--muted {
  background: var(--theme-background-2, var(--default-theme-background-2));
}
.scalar-card--contrast {
  background: var(--theme-background-3, var(--default-theme-background-3));
}
.scalar-card--frameless {
  padding: 0;
}
.scalar-card--transparent {
  background: var(--theme-background-1, var(--default-theme-background-1));
}
</style>
