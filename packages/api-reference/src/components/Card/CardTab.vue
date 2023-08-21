<script lang="ts" setup>
import { Tab } from '@headlessui/vue'
</script>
<template>
  <Tab
    v-slot="{ selected }"
    as="template">
    <button
      :class="{ 'tab': true, 'tab-selected': selected }"
      type="button">
      <slot />
    </button>
  </Tab>
</template>
<style scoped>
.tab {
  background: none;
  border: none;
  font-size: var(--theme-micro);
  font-family: var(--theme-font);
  color: var(--theme-color-2);
  font-weight: var(--theme-semibold);
  line-height: calc(var(--theme-micro) + 2px);
  cursor: pointer;
}

.tab-selected {
  color: var(--theme-color-1);
  text-decoration: underline;
  text-underline-offset: var(--theme-micro);
}
</style>
