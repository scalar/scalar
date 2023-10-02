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
  font-size: var(--theme-mini, var(--default-theme-mini));
  font-family: var(--theme-font, var(--default-theme-font));
  color: var(--theme-color-2, var(--default-theme-color-2));
  font-weight: var(--theme-semibold, var(--default-theme-semibold));
  line-height: calc(var(--theme-mini, var(--default-theme-mini)) + 2px);
  cursor: pointer;
  padding: 0;
  margin-right: 3px;
  text-transform: uppercase;
}

.tab-selected {
  color: var(--theme-color-1, var(--default-theme-color-1));
  text-decoration: underline;
  text-underline-offset: var(--theme-micro, var(--default-theme-micro));
}
</style>
