<script lang="ts" setup>
import { TabGroup, TabList } from '@headlessui/vue'
import { ScalarCardHeader } from '@scalar/components/card'

const emit = defineEmits<{
  (e: 'change', index: number): void
}>()

const changeTab = (index: number) => {
  emit('change', index)
}
</script>
<template>
  <ScalarCardHeader
    class="scalar-card-header scalar-card-header-tabs flex-col items-stretch">
    <TabGroup @change="changeTab">
      <TabList
        class="tab-list custom-scroll flex-wrap items-start gap-x-4 gap-y-2">
        <slot />
      </TabList>
    </TabGroup>
    <template #actions>
      <div class="ml-auto px-3 pb-2">
        <slot name="actions" />
      </div>
    </template>
  </ScalarCardHeader>
</template>
<style scoped>
.tab-list {
  display: flex;
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
