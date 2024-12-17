<script setup lang="ts">
import { ScalarIcon, useModal } from '@scalar/components'
import type { Spec } from '@scalar/types/legacy'
import { onBeforeUnmount, onMounted } from 'vue'

import { isMacOs } from '../../helpers'
import { useApiClient } from '../ApiClientModal'
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
const { client } = useApiClient()

const handleHotKey = (e: KeyboardEvent) => {
  if (
    (isMacOs() ? e.metaKey : e.ctrlKey) &&
    e.key === props.searchHotKey &&
    !client.value?.modalState.open
  ) {
    e.preventDefault()
    e.stopPropagation()
    modalState.open ? modalState.hide() : modalState.show()
  }
}

// Handle keyboard shortcuts
// TODO: we can move this to the hotkey event bus but we would need to set up a custom key from the searchHotKey config
// and make sure it works correctly inside the references first
onMounted(() => window.addEventListener('keydown', handleHotKey))
onBeforeUnmount(() => window.removeEventListener('keydown', handleHotKey))
</script>
<template>
  <button
    class="sidebar-search"
    :class="$attrs.class"
    type="button"
    @click="modalState.show">
    <ScalarIcon
      class="scalar-search-icon"
      icon="Search"
      size="sm"
      thickness="2.5" />
    <div class="sidebar-search-input">
      <span class="sr-only">Open </span>
      <span class="sidebar-search-placeholder">Search</span>
      <span class="sidebar-search-shortcut">
        <span class="sr-only">(Keyboard Shortcut)</span>
        <kbd class="sidebar-search-key">
          {{ isMacOs() ? '⌘' : '⌃' }}{{ searchHotKey }}
        </kbd>
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
  border-radius: var(--scalar-radius);
  box-shadow: 0 0 0 0.5px
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
.sidebar-search-key {
  text-transform: uppercase;
  background-color: var(--scalar-background-2);
  padding: 3px 5px;
  margin: 2px;
  border-radius: var(--scalar-radius);
  color: var(--scalar-sidebar-color-2, var(--scalar-color-2));
}

.scalar-search-icon {
  padding: 0;
  margin-right: 6px;
  width: 12px;
}
</style>
