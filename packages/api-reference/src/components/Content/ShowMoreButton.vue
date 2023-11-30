<script setup lang="ts">
import { ScalarIcon } from '@scalar/components'

import { useNavigation } from '../../hooks'

defineProps<{
  id: string
}>()

const { setCollapsedSidebarItem } = useNavigation()
</script>

<template>
  <button
    class="show-more"
    type="button"
    @click="setCollapsedSidebarItem(id, true)">
    Show More
    <ScalarIcon
      class="show-more-icon"
      icon="ChevronDown" />
  </button>
</template>

<style scoped>
.show-more {
  background: var(--theme-background-1, var(--default-theme-background-1));
  appearance: none;
  border: none;
  border: 1px solid var(--theme-border-color, var(--default-theme-border-color));
  padding: 8px 12px;
  border-radius: 30px;
  color: var(--theme-color-1, var(--default-theme-color-1));
  font-weight: var(--theme-semibold, var(--default-theme-semibold));
  font-size: var(--theme-small, var(--default-theme-small));
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  margin: 48px auto;
}
.show-more:hover {
  color: var(--theme-color-2, var(--default-theme-color-2));
  cursor: pointer;
}
.show-more-icon {
  width: 14px;
  height: 14px;
  margin-left: 3px;
}
.show-more:active {
  box-shadow: 0 0 0 1px
    var(--theme-border-color, var(--default-theme-border-color));
}

@media (max-width: 1165px) {
  .show-more {
    margin: 24px auto;
  }
}
</style>
