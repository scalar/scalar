<script setup lang="ts">
import { ScalarSidebarSearchButton, useModal } from '@scalar/components'
import { isMacOS } from '@scalar/helpers/general/is-mac-os'
import type { Spec } from '@scalar/types/legacy'
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

import { useApiClient } from '@/features/ApiClientModal'
import SearchModal from '@/features/Search/SearchModal.vue'

const props = withDefaults(
  defineProps<{
    spec: Spec
    searchHotKey?: string
  }>(),
  {
    searchHotKey: 'k',
  },
)

const button = ref<HTMLButtonElement>()
const modalState = useModal()
const { client } = useApiClient()

const handleHotKey = (e: KeyboardEvent) => {
  if (
    (isMacOS() ? e.metaKey : e.ctrlKey) &&
    e.key === props.searchHotKey &&
    !client.value?.modalState.open
  ) {
    e.preventDefault()
    e.stopPropagation()
    modalState.open ? modalState.hide() : modalState.show()
  }
}

watch(
  () => modalState.open,
  (next, prev) => {
    // Return focus to the button when the modal is closed
    if (!next && prev) {
      nextTick(() => {
        button.value?.focus()
      })
    }
  },
)

// Handle keyboard shortcuts
// TODO: we can move this to the hotkey event bus but we would need to set up a custom key from the searchHotKey config
// and make sure it works correctly inside the references first
onMounted(() => window.addEventListener('keydown', handleHotKey))
onBeforeUnmount(() => window.removeEventListener('keydown', handleHotKey))

function handleClick() {
  modalState.show()
}
</script>
<template>
  <ScalarSidebarSearchButton
    ref="button"
    @click="handleClick">
    <span class="sr-only">Open Search</span>
    <span
      aria-hidden="true"
      class="sidebar-search-placeholder">
      Search
    </span>
    <template #shortcut>
      <template v-if="isMacOS()">⌘</template>
      <template v-else>
        <span class="sr-only">CTRL</span>
        <span aria-hidden="true">⌃</span>
      </template>
      {{ searchHotKey }}
    </template>
  </ScalarSidebarSearchButton>
  <SearchModal
    :modalState="modalState"
    :parsedSpec="spec" />
</template>
