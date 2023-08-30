<script setup lang="ts">
import { isMacOS } from '@scalar/use-tooltip'

import FlowIcon from './Icon/FlowIcon.vue'
</script>
<template>
  <button
    class="sidebar-search"
    type="button">
    <FlowIcon
      class="search-icon"
      icon="Search" />
    <div class="sidebar-search-input">
      <span
        class="sidebar-search-placeholder"
        type="text">
        Search
      </span>
      <span class="sidebar-search-shortcut">
        <span class="sidebar-search-key">{{ isMacOS() ? '⌘' : '⌃' }}</span>
        <span class="sidebar-search-key">k</span>
      </span>
    </div>
  </button>
</template>
<style scoped>
.sidebar-search {
  display: flex;
  align-items: center;
  position: relative;
  /* Sub */
  --margin-x: 12px;
  width: calc(100% - 2 * var(--margin-x));
  margin: 12px var(--margin-x) 6px var(--margin-x);
  padding: 0 3px 0 12px;

  color: var(--sidebar-color-2, var(--theme-color-2));
  outline: none;
  border-radius: var(--theme-radius-lg);
  border: 1px solid var(--theme-border-color);
  /* prettier-ignore */
  background: var(--scalar-api-reference-sidebar-search-background, var(--theme-background-1));
  cursor: pointer;
  appearance: none;
}

.sidebar-search-input {
  font-size: var(--theme-small);
  font-weight: var(--theme-semibold);
  height: 31px;

  user-select: none;
  z-index: 10;
  position: relative;
  display: flex;
  width: 100%;
  justify-content: space-between;
  align-items: center;
}
.sidebar-search-shortcut {
  text-transform: uppercase;
}
.sidebar-search-key {
  background-color: var(--theme-background-2);
  padding: 3px 5px;
  margin: 2px;
  border-radius: var(--theme-radius);
  color: var(--theme-color-3);
}

.search-icon {
  padding: 0;
  margin-right: 9px;
  width: 12px;
}
</style>
