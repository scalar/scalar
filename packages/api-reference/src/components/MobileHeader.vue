<script setup lang="ts">
import { useTemplateStore } from '../stores/template'
import DarkModeToggle from './DarkModeToggle.vue'
import FlowIconButton from './FlowIconButton.vue'

defineProps<{ isDarkMode: boolean }>()

defineEmits<{
  (e: 'toggleDarkMode'): void
}>()

const {
  state: templateState,
  setItem: setTemplateItem,
  toggleItem: toggleTemplateItem,
} = useTemplateStore()
</script>
<template>
  <div class="references-mobile-header t-doc__header">
    <FlowIconButton
      :icon="templateState.showMobileDrawer ? 'Close' : 'Menu'"
      :label="templateState.showMobileDrawer ? 'Close Menu' : 'Open Menu'"
      width="20px"
      @click="() => toggleTemplateItem('showMobileDrawer')" />
    <span class="references-mobile-breadcrumbs"><slot /></span>
    <div class="sidebar-mobile-actions">
      <FlowIconButton
        icon="Search"
        label="Search"
        variant="clear"
        width="24px"
        @click="setTemplateItem('showSearch', true)" />
      <DarkModeToggle
        class="sidebar-mobile-darkmode-toggle"
        :isDarkMode="isDarkMode"
        @toggleDarkMode="$emit('toggleDarkMode')" />
    </div>
  </div>
</template>
<style scoped>
.references-mobile-header {
  display: flex;
  align-items: center;
  gap: 12px;
  height: 100%;
  width: 100%;
  padding: 0 8px;
  background: var(--theme-background-1, var(--default-theme-background-1));
  border-bottom: 1px solid
    var(--theme-border-color, var(--default-theme-border-color));
}

.references-mobile-breadcrumbs {
  flex: 1;
  min-width: 0;
  font-size: var(--theme-small, var(--default-theme-small));
  font-weight: var(--theme-semibold, var(--default-theme-semibold));
  color: var(--theme-color-1, var(--default-theme-color-1));
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
</style>
