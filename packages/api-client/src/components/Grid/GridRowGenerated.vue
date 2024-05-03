<script setup lang="ts">
import type { GeneratedParameter } from 'src/types'

import GridRow from './GridRow.vue'

defineProps<{
  item: GeneratedParameter
}>()
</script>
<template>
  <GridRow class="table-row-generated">
    <template #key>
      <input
        disabled
        placeholder="key"
        :value="item.name" />
    </template>
    <template #value>
      <input
        disabled
        placeholder="value"
        type="password"
        :value="item.value" />
    </template>
    <template #description>
      <input
        disabled
        value="Read-only" />
    </template>
  </GridRow>
</template>
<style scoped>
/* Specificity bump */
.table-row-generated.table-row-generated :deep(*) {
  color: var(--scalar-color-3);
}
.table-row-generated.table-row-generated :deep(input) {
  pointer-events: none;
}
</style>
