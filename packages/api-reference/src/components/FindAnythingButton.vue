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
        <span class="sidebar-search-key">{{ isMacOS() ? '⌘' : '⌃' }}k</span>
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
  --default-margin-x: 12px;
  width: calc(100% - 2 * var(--margin-x, var(--default-margin-x)));
  margin: 12px var(--margin-x, var(--default-margin-x)) 6px
    var(--margin-x, var(--default-margin-x));
  padding: 0 3px 0 12px;
  background: var(
    --sidebar-search-background,
    var(
      --default-sidebar-search-background,
      var(--theme-background-1, var(--default-theme-background-1))
    )
  );
  color: var(
    --sidebar-color-2,
    var(
      --default-sidebar-color-2,
      var(--theme-color-2, var(--default-theme-color-2))
    )
  );
  outline: none;
  border-radius: var(--theme-radius, var(--default-theme-radius));
  box-shadow: 0 0 0 1px
    var(
      --sidebar-search-border,
      var(
        --default-sidebar-search-border,
        var(--theme-border-color, var(--default-theme-border-color))
      )
    );
  /* prettier-ignore */
  cursor: pointer;
  appearance: none;
  border: none;
}

.sidebar-search-input {
  font-size: var(--theme-mini, var(--default-theme-mini));
  font-weight: var(--theme-semibold, var(--default-theme-semibold));
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
  background-color: var(
    --theme-background-2,
    var(--default-theme-background-2)
  );
  padding: 3px 5px;
  margin: 2px;
  border-radius: var(--theme-radius, var(--default-theme-radius));
  color: var(
    --sidebar-color-2,
    var(--default-sidebar-color-2),
    var(--theme-color-2, var(--default-theme-color-2))
  );
}

.search-icon {
  padding: 0;
  margin-right: 9px;
  width: 12px;
}
</style>
