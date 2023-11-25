<script setup lang="ts">
import { useDarkModeState } from '../hooks'
import FlowIcon from './Icon/FlowIcon.vue'

const { toggleDarkMode } = useDarkModeState()
</script>
<template>
  <div class="references-classic-header">
    <slot />
    <FlowIcon
      class="references-classic-header-icon"
      icon="LightDarkModeToggle"
      @click="toggleDarkMode" />
  </div>
</template>
<style scoped>
.references-classic-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.references-classic-header-icon {
  height: 24px;
  color: var(--theme-color-1, var(--default-theme-color-1));
}
</style>
