<script setup lang="ts">
import { ScalarIcon } from '@scalar/components'
import { useKeyboardEvent } from '@scalar/use-keyboard-event'
import { useModal } from '@scalar/use-modal'
import { isMacOS } from '@scalar/use-tooltip'

import { useActive } from '../hooks/useActive'
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

const { isActive } = useActive()

const modalState = useModal()

useKeyboardEvent({
  keyList: [props.searchHotKey],
  withCtrlCmd: true,
  handler: () => (modalState.open ? modalState.hide() : modalState.show()),
  active: () => isActive.value,
})
</script>
<template>
  <button
    class="sidebar-search"
    type="button"
    @click="modalState.show">
    <ScalarIcon
      class="search-icon"
      icon="Search" />
    <div class="sidebar-search-input">
      <span
        class="sidebar-search-placeholder"
        type="text">
        Search
      </span>
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
  padding: 0 3px 0 12px;
  min-width: 220px;
  max-width: 100%;
  font-family: var(--theme-font, var(--default-theme-font));
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
      --sidebar-search-border-color,
      var(
        --default-sidebar-search-border-color,
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
