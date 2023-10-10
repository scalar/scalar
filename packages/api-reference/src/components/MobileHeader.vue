<script setup lang="ts">
import { useTemplateStore } from '../stores/template'
import FlowIconButton from './FlowIconButton.vue'

const {
  state: templateState,
  setItem: setTemplateItem,
  toggleItem: toggleTemplateItem,
} = useTemplateStore()
</script>
<template>
  <div class="references-mobile-header">
    <FlowIconButton
      :icon="templateState.showMobileDrawer ? 'Close' : 'Menu'"
      :label="templateState.showMobileDrawer ? 'Close Menu' : 'Open Menu'"
      width="20px"
      @click="() => toggleTemplateItem('showMobileDrawer')" />
    <span class="references-mobile-breadcrumbs"><slot /></span>

    <FlowIconButton
      icon="Search"
      label="Search"
      variant="clear"
      width="24px"
      @click="setTemplateItem('showSearch', true)" />
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
  border-bottom: var(--theme-border);
}

.references-mobile-breadcrumbs {
  flex: 1;
  min-width: 0;
  font-size: var(--theme-small);
  font-weight: var(--theme-semibold);
  color: var(--header-color-1);
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
</style>
