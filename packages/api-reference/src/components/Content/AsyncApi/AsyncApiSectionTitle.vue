<script setup lang="ts">
/**
 * Shared heading for AsyncAPI sub-sections (bindings, reply, and similar). Centralizes the
 * underlined section-title styling so the individual sections do not each redefine it.
 */
</script>

<template>
  <div class="async-api-section-title">
    <slot />
  </div>
</template>

<style scoped>
.async-api-section-title {
  font-size: var(--scalar-font-size-2);
  font-weight: var(--scalar-semibold);
  color: var(--scalar-color-1);
  padding-bottom: 8px;
  border-bottom: var(--scalar-border-width) solid var(--scalar-border-color);
  margin-bottom: 8px;
}
</style>
