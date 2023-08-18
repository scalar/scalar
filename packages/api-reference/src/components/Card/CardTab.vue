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
  font-size: var(--scalar-api-reference-theme-font-size-4);
  font-family: var(--scalar-api-reference-font-sans);
  color: var(--scalar-api-reference-theme-color-2);
  font-weight: var(--scalar-api-reference-theme-semibold);
  line-height: calc(var(--scalar-api-reference-theme-font-size-4) + 2px);
  cursor: pointer;
}

.tab-selected {
  color: var(--scalar-api-reference-theme-color-1);
  text-decoration: underline;
  text-underline-offset: calc(
    var(--scalar-api-reference-theme-font-size-4) - 2px
  );
}
</style>
