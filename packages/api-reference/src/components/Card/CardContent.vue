<script setup lang="ts">
withDefaults(defineProps<{ muted?: boolean; frameless?: boolean }>(), {
  muted: false,
  frameless: false,
})
</script>
<template>
  <div
    :class="{
      'card-content': true,
      'card--muted': muted,
      'card--frameless': frameless,
    }">
    <slot />
  </div>
</template>
<style scoped>
.card-content {
  overflow: auto;
  padding: 12px 0 12px 12px;
  border-bottom: 1px solid var(--theme-border-color);
}

.card-content:last-of-type {
  border-bottom: none;
}

.card--muted {
  background: var(--theme-background-2);
}

.card--frameless {
  padding: 0;
}
</style>
