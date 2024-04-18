<script setup lang="ts">
import { ScalarIcon } from '@scalar/components'
import { useModal } from '@scalar/use-modal'
import { isMacOS } from '@scalar/use-tooltip'
import { useMagicKeys, whenever } from '@vueuse/core'

import { type Spec } from '../types'
import SearchModal from './SearchModal.vue'

const props = withDefaults(
  defineProps<{
    spec: Spec
    searchHotKey?: string
  }>(),
  {
    searchHotKey: 'k',
  },
)

const modalState = useModal()

const keys = useMagicKeys({
  passive: false,
  onEventFired(e) {
    // Remove default behaviour for keypress
    if (!isMacOS() && e.ctrlKey && e.key === props.searchHotKey) {
      e.preventDefault()
      e.stopPropagation()
    }
  },
})

whenever(keys[`${isMacOS() ? 'meta' : 'control'}_${props.searchHotKey}`], () =>
  modalState.open ? modalState.hide() : modalState.show(),
)
</script>
<template>
  <button
    class="sidebar-search"
    :class="$attrs.class"
    type="button"
    @click="modalState.show">
    <ScalarIcon
      class="search-icon"
      icon="Search"
      size="sm" />
    <div class="sidebar-search-input">
      <span class="sidebar-search-placeholder">Search</span>
      <span class="sidebar-search-shortcut">
        <span class="sidebar-search-key">
          {{ isMacOS() ? '⌘' : '⌃' }}{{ searchHotKey }}
        </span>
      </span>
    </div>
  </button>
  <SearchModal
    :modalState="modalState"
    :parsedSpec="spec" />
</template>
<style scoped>
.sidebar-search {
  display: flex;
  align-items: center;
  position: relative;
  padding: 0 3px 0 9px;
  min-width: 254px;
  max-width: 100%;
  font-family: var(--scalar-font);
  background: var(
    --scalar-sidebar-search-background,
    var(--scalar-background-1)
  );
  color: var(--scalar-sidebar-color-2, var(--scalar-color-2));
  outline: none;
  border-radius: var(--scalar-radius);
  box-shadow: 0 0 0 1px
    var(--scalar-sidebar-search-border-color, var(--scalar-border-color));
  /* prettier-ignore */
  cursor: pointer;
  appearance: none;
  border: none;
}

.sidebar-search-input {
  font-size: var(--scalar-mini);
  font-weight: var(--scalar-semibold);
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
  background-color: var(--scalar-background-2);
  padding: 3px 5px;
  margin: 2px;
  border-radius: var(--scalar-radius);
  color: var(--scalar-sidebar-color-2, var(--scalar-color-2));
}

.search-icon {
  padding: 0;
  margin-right: 6px;
  width: 12px;
}
</style>
