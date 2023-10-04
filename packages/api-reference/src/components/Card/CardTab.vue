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
      <span>
        <slot />
      </span>
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
  position: relative;
}
.tab:before {
  content: '';
  position: absolute;
  z-index: 0;
  left: -6px;
  top: -6px;
  width: calc(100% + 12px);
  height: calc(100% + 12px);
  border-radius: var(--theme-radius, var(--default-theme-radius));
  background: var(--theme-background-3, var(--default-theme-background-3));
  opacity: 0;
}
.tab:hover:before {
  opacity: 1;
}
.tab span {
  z-index: 1;
  position: relative;
}
.tab-selected {
  color: var(--theme-color-1, var(--default-theme-color-1));
  text-decoration: underline;
  text-underline-offset: var(--theme-micro, var(--default-theme-micro));
}
</style>
