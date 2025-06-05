<script setup lang="ts">
import { ScalarIcon } from '@scalar/components'

import { useSidebar } from '@/features/sidebar'
import { useConfig } from '@/hooks/useConfig'

const { id } = defineProps<{
  id: string
}>()

const { setCollapsedSidebarItem } = useSidebar()
const config = useConfig()

const handleClick = () => {
  setCollapsedSidebarItem(id, true)
  config.value.onShowMore?.(id)
}
</script>

<template>
  <button
    class="show-more"
    type="button"
    @click="handleClick">
    Show More
    <ScalarIcon
      class="show-more-icon"
      icon="ChevronDown" />
  </button>
</template>

<style scoped>
.show-more {
  appearance: none;
  border: none;
  border: var(--scalar-border-width) solid var(--scalar-border-color);
  margin: auto;
  padding: 8px 12px 8px 16px;
  border-radius: 30px;
  color: var(--scalar-color-1);
  font-weight: var(--scalar-semibold);
  font-size: var(--scalar-small);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  top: -48px;
}
.show-more:hover {
  background: var(--scalar-background-2);
  cursor: pointer;
}
.show-more-icon {
  /* todo remove but its for docusaurus */
  width: 16px !important;
  height: 16px !important;
  margin-left: 3px;
}
.show-more:active {
  box-shadow: 0 0 0 1px var(--scalar-border-color);
}
@container narrow-references-container (max-width: 900px) {
  .show-more {
    top: -24px;
  }
}
</style>
