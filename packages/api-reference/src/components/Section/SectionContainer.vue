<script setup lang="ts">
defineProps<{
  /**
   * Skips rendering the section container div and its styles, rendering only the slot directly.
   */
  omit?: boolean
}>()
</script>

<template>
  <slot v-if="omit" />
  <div
    v-else
    class="section-container">
    <slot />
  </div>
</template>

<style scoped>
.section-container {
  position: relative;
  padding: 0 60px;
  width: 100%;
  border-top: var(--scalar-border-width) solid var(--scalar-border-color);
}
.section-container:has(.introduction-section) {
  border-top: none;
}
@container narrow-references-container (max-width: 900px) {
  .section-container {
    padding: 0;
  }
}
</style>
