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
  <CardHeader>
    <TabGroup @change="changeTab">
      <TabList class="tab-list">
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
}
</style>
