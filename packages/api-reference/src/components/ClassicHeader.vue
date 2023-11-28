<script setup lang="ts">
import { useDarkModeState } from '../hooks'
import FlowIcon from './Icon/FlowIcon.vue'

const { toggleDarkMode } = useDarkModeState()
</script>
<template>
  <div class="references-classic-header-container">
    <div class="references-classic-header">
      <slot />
      <FlowIcon
        class="references-classic-header-icon"
        icon="LightDarkModeToggle"
        @click="toggleDarkMode" />
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
}
.references-narrow .references-classic-header {
  padding: 0 24px;
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
