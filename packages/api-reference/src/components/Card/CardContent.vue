<script setup lang="ts">
withDefaults(
  defineProps<{
    muted?: boolean
    frameless?: boolean
    borderless?: boolean
  }>(),
  {
    muted: false,
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
      'card--frameless': frameless,
      'card--borderless': borderless,
    }">
    <slot />
  </div>
</template>
<style scoped>
.card-content {
  overflow: auto;
  padding: 10px 12px;
  border-bottom: 1px solid var(--scalar-api-reference-theme-border-color);
}

.card-content:last-of-type,
.card-content.card--borderless {
  border-bottom: none;
}

.card--muted {
  background: var(--scalar-api-reference-theme-background-2);
}

.card--frameless {
  padding: 0;
}
</style>
