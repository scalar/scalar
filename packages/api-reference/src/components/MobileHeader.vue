<script setup lang="ts">
import { ScalarIconButton } from '@scalar/components'
import { computed } from 'vue'

import { useSidebar } from '@/features/sidebar'
import { useNavState } from '@/hooks/useNavState'

const { isSidebarOpen, items } = useSidebar()
const { getReferenceId } = useNavState()

const breadcrumb = computed(() => items.value?.titles.get(getReferenceId()))
</script>
<template>
  <div class="references-mobile-header t-doc__header">
    <ScalarIconButton
      :icon="isSidebarOpen ? 'Close' : 'Menu'"
      :label="isSidebarOpen ? 'Close Menu' : 'Open Menu'"
      size="md"
      @click="isSidebarOpen = !isSidebarOpen" />
    <span class="references-mobile-breadcrumbs">{{ breadcrumb }}</span>
    <div class="references-mobile-header-actions">
      <slot name="actions" />
    </div>
  </div>
</template>
<style scoped>
.references-mobile-header {
  display: none;
  align-items: center;
  height: 100%;
  width: 100dvw;
  padding: 0 8px;
  background: var(--scalar-background-1);
  border-bottom: 1px solid var(--scalar-border-color);
}

.references-mobile-breadcrumbs {
  flex: 1;
  min-width: 0;
  font-size: var(--scalar-small);
  font-weight: var(--scalar-semibold);
  color: var(--scalar-color-1);
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.references-mobile-header-actions {
  display: flex;
  flex-direction: row;
  gap: 4px;
  height: 24px;
  align-items: center;
  padding-left: 4px;
}

@media (max-width: 1000px) {
  .references-mobile-header {
    display: flex;
  }
}
</style>
