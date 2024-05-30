<script setup lang="ts">
import { ScalarButton } from '@scalar/components'

import GridRow from './GridRow.vue'

defineProps<{
  showDescription?: boolean
}>()

defineEmits<{
  (e: 'update:showDescription', v: boolean): void
}>()
</script>
<template>
  <GridRow :showDescription="showDescription">
    <template #key>
      <label class="table-column-header">Key</label>
    </template>
    <template #value>
      <label class="table-column-header">Value</label>
    </template>
    <template #description>
      <label class="table-column-header">Description</label>
    </template>
    <template #meta>
      <ScalarButton
        class="table-description-toggle"
        variant="text"
        @click="$emit('update:showDescription', !showDescription)">
        <svg
          fill="currentColor"
          height="12"
          width="18"
          xmlns="http://www.w3.org/2000/svg">
          <path d="M0 11h9v-1H0v1ZM0 0v1h18V0H0Zm0 6h18V5H0v1Z" />
        </svg>
      </ScalarButton>
    </template>
  </GridRow>
</template>
<style scoped>
.table-column-header {
  background: transparent;
  text-transform: capitalize;
  display: block;
  padding: 9px;
  font-weight: var(--scalar-semibold);
  color: var(--scalar-color-3);
  font-size: var(--scalar-mini);
}
.table-description-toggle {
  padding: 0;
  width: 100%;
  height: 100%;
}
.table-description-toggle svg {
  width: 13px;
  height: 13px;
  margin: 0 1px;
  color: var(--scalar-color-3);
  cursor: pointer;
}
.table-description-toggle svg:hover {
  color: var(--scalar-color-2);
}
</style>
