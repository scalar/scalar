<script setup lang="ts">
withDefaults(
  defineProps<{
    muted?: boolean
    contrast?: boolean
    frameless?: boolean
    borderless?: boolean
  }>(),
  {
    muted: false,
    contrast: false,
    frameless: false,
    borderless: false,
  },
)
</script>
<template>
  <div
    :class="{
      'card-content': true,
      'card--muted': muted,
      'card--contrast': contrast,
      'card--frameless': frameless,
      'card--borderless': borderless,
    }">
    <slot />
  </div>
</template>
<style scoped>
.card-content {
  overflow: auto;
  border-bottom: 1px solid
    var(--theme-border-color, var(--default-theme-border-color));
}
.card-content :deep(.simple-table .simple-header) {
  display: none;
}
.card-content:last-of-type,
.card-content.card--borderless {
  border-bottom: none;
}

.card--muted {
  background: var(--theme-background-2, var(--default-theme-background-2));
}
.card--contrast {
  background: var(--theme-background-3, var(--default-theme-background-3));
}
.card--frameless {
  padding: 0;
}
</style>
