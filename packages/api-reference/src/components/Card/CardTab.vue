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
  font-size: var(--scalar-mini);
  font-family: var(--scalar-font);
  color: var(--scalar-color-2);
  font-weight: var(--scalar-semibold);
  line-height: calc(var(--scalar-mini) + 2px);
  white-space: nowrap;
  cursor: pointer;
  padding: 0;
  margin-right: 3px;
  text-transform: uppercase;
  position: relative;
  line-height: 1.35;
}
.tab:before {
  content: '';
  position: absolute;
  z-index: 0;
  left: -6px;
  top: -6px;
  width: calc(100% + 12px);
  height: calc(100% + 12px);
  border-radius: var(--scalar-radius);
  background: var(--scalar-background-3);
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
  color: var(--scalar-color-1);
  text-decoration: underline;
  text-underline-offset: var(--scalar-micro);
}
</style>
