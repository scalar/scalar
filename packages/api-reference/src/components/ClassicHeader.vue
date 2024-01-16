<script setup lang="ts">
import DarkModeIconToggle from './DarkModeIconToggle.vue'
</script>
<template>
  <div class="references-classic-header-container">
    <div class="references-classic-header">
      <slot />
      <DarkModeIconToggle class="t-doc__sidebar" />
    </div>
  </div>
</template>
<style scoped>
.references-classic-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;

  max-width: var(--refs-content-max-width);
  margin: auto;
  padding: 12px 0;
}
.references-narrow .references-classic-header {
  padding: 12px 24px;
}
.references-classic-header-container {
  padding: 0 60px;
}
.references-narrow .references-classic-header-container {
  padding: 0;
}
.references-classic-header-icon {
  height: 24px;
  color: var(--theme-color-1, var(--default-theme-color-1));
}
</style>
