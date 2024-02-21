<script lang="ts" setup>
import { TabGroup, TabList } from '@headlessui/vue'

import CardHeader from './CardHeader.vue'

const emit = defineEmits<{
  (e: 'change', index: number): void
}>()

const changeTab = (index: number) => {
  emit('change', index)
}
</script>
<template>
  <CardHeader class="scalar-card-header-tabs">
    <TabGroup @change="changeTab">
      <TabList class="tab-list custom-scroll">
        <slot />
      </TabList>
    </TabGroup>
    <template #actions>
      <slot name="actions" />
    </template>
  </CardHeader>
</template>
<style scoped>
.tab-list {
  display: flex;
  gap: 6px;
  position: relative;
  flex: 1;
  padding: 9px 12px;
  overflow: auto;
}
.scalar-card-header-tabs {
  padding: 0;
}
</style>
