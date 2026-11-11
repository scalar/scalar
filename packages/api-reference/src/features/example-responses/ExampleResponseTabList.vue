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
<style>
/*
 * The tab strip sits on the card rather than on a surface, so it draws its own rule for the
 * selected tab's underline to land on and keeps the card's padding below it. Kept out of the
 * scoped block so the selector stays a single class and a theme or `customCss` rule still wins.
 */
.scalar-card-header-tabs {
  border-radius: 0;
  box-shadow: inset 0 calc(var(--scalar-border-width) * -1) 0
    var(--scalar-border-color);
  margin-bottom: 4px;
}
</style>
