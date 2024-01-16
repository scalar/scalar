<script setup lang="ts">
import { ScalarIconButton } from '@scalar/components'

import { useSidebar } from '../hooks'

defineProps<{
  open?: boolean
}>()

defineEmits<{
  (event: 'update:open', open: boolean): void
}>()

const { breadcrumb } = useSidebar()
</script>
<template>
  <div class="references-mobile-header t-doc__header">
    <ScalarIconButton
      :icon="open ? 'Close' : 'Menu'"
      :label="open ? 'Close Menu' : 'Open Menu'"
      size="md"
      @click="$emit('update:open', !open)" />
    <span class="references-mobile-breadcrumbs">{{ breadcrumb }}</span>
    <div class="references-mobile-header-actions">
      <slot name="actions" />
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

.references-mobile-header-actions {
  display: flex;
  flex-direction: row;
  gap: 4px;
  height: 24px;
  align-items: center;
  padding-left: 4px;
}
</style>
