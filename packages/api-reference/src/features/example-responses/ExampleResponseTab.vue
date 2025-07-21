<script lang="ts" setup>
import { Tab } from '@headlessui/vue'
</script>
<template>
  <Tab
    v-slot="{ selected }"
    as="template">
    <button
      class="tab"
      :class="{ 'tab-selected': selected }"
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
  font-size: var(--scalar-small);
  font-family: var(--scalar-font);
  font-weight: var(--scalar-font-normal);
  color: var(--scalar-color-2);
  line-height: calc(var(--scalar-small) + 2px);
  white-space: nowrap;
  cursor: pointer;
  padding: 0;
  margin-right: 3px;
  text-transform: uppercase;
  position: relative;
  line-height: 22px;
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
.tab:hover:before,
.tab:focus-visible:before {
  opacity: 1;
}
.tab:focus-visible:before {
  outline: 1px solid var(--scalar-color-accent);
}
.tab span {
  z-index: 1;
  position: relative;
}
.tab-selected {
  color: var(--scalar-color-1);
  font-weight: var(--scalar-semibold);
}
.tab-selected:after {
  content: '';
  position: absolute;
  background: currentColor;
  width: 100%;
  left: 0;
  height: 1px;
  bottom: calc(var(--tab-list-padding-y) * -1);
}
</style>
