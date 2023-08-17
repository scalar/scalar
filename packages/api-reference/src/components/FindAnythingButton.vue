<script setup lang="ts">
import FlowIcon from './Icon/FlowIcon.vue'
</script>
<template>
  <button
    class="sidebar-search"
    type="button">
    <FlowIcon
      class="search-icon"
      icon="Search" />
    <span
      class="sidebar-search-input"
      type="text">
      Find Anything
    </span>
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
  padding: 0 12px;

  color: var(--scalar-api-reference-theme-color-3);
  outline: none;
  border-radius: var(--scalar-api-reference-rounded);
  border: var(--scalar-api-reference-border);
  /* prettier-ignore */
  background: var(--scalar-api-reference-sidebar-search-background, var(--scalar-api-reference-theme-background-1));
  cursor: pointer;
  appearance: none;
}

.sidebar-search-input {
  font-size: var(--scalar-api-reference-theme-small);
  font-weight: var(--scalar-api-reference-theme-semibold);
  line-height: 31px;

  user-select: none;
  z-index: 10;
  position: relative;
  display: block;
}

.search-icon {
  padding: 0;
  margin-right: 9px;
  width: 12px;
}
</style>
