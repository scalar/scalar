<script lang="ts" setup>
import { TabGroup, TabList } from '@headlessui/vue'
import { ScalarCardHeader } from '@scalar/components'

const emit = defineEmits<{
  (e: 'change', index: number): void
}>()

const changeTab = (index: number) => {
  emit('change', index)
}
</script>
<template>
  <ScalarCardHeader class="scalar-card-header scalar-card-header-tabs">
    <TabGroup @change="changeTab">
      <TabList class="tab-list custom-scroll">
        <slot />
      </TabList>
    </TabGroup>
    <template #actions>
      <slot name="actions" />
    </template>
  </ScalarCardHeader>
</template>
<style scoped>
.tab-list {
  display: flex;
  gap: 6px;
  position: relative;
  flex: 1;
  --tab-list-padding-y: 7px;
  --tab-list-padding-x: 12px;
  padding: var(--tab-list-padding-y) var(--tab-list-padding-x);
  overflow: auto;
}
.scalar-card-header.scalar-card-header-tabs {
  padding: 0;
}
</style>
