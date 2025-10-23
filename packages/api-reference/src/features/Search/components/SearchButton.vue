<script setup lang="ts">
import {
  ScalarIconButton,
  ScalarSidebarSearchButton,
  useModal,
} from '@scalar/components'
import { isMacOS } from '@scalar/helpers/general/is-mac-os'
import { ScalarIconMagnifyingGlass } from '@scalar/icons'
import type { TraversedEntry } from '@scalar/workspace-store/schemas/navigation'
import type { OpenApiDocument } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

import SearchModal from './SearchModal.vue'

const { searchHotKey = 'k', hideModels = false } = defineProps<{
  forceIcon?: boolean
  searchHotKey?: string
  hideModels?: boolean
  document?: OpenApiDocument
  items: TraversedEntry[]
}>()

const emit = defineEmits<{
  (e: 'toggleSidebarItem', id: string, open?: boolean): void
}>()

const button = ref<InstanceType<typeof ScalarSidebarSearchButton>>()
const modalState = useModal()

const handleHotKey = (e: KeyboardEvent) => {
  if ((isMacOS() ? e.metaKey : e.ctrlKey) && e.key === searchHotKey) {
    e.preventDefault()
    e.stopPropagation()

    if (modalState.open) {
      modalState.hide()
    } else {
      modalState.show()
    }
  }
}

watch(
  () => modalState.open,
  async (next, prev) => {
    // Return focus to the button when the modal is closed
    if (!next && prev) {
      await nextTick()
      button.value?.$el.focus()
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
  <ScalarIconButton
    v-if="forceIcon"
    :icon="ScalarIconMagnifyingGlass"
    label="Search"
    @click="handleClick" />
  <ScalarSidebarSearchButton
    v-else
    ref="button"
    class="w-full"
    :class="$attrs.class"
    @click="handleClick">
    <span class="sr-only">Open Search</span>
    <span
      aria-hidden="true"
      class="sidebar-search-placeholder">
      Search
    </span>
    <template #shortcut>
      <template v-if="isMacOS()">
        <span class="sr-only">Command</span>
        <span aria-hidden="true">⌘</span>
      </template>
      <template v-else>
        <span class="sr-only">CTRL</span>
        <span aria-hidden="true">⌃</span>
      </template>
      {{ searchHotKey }}
    </template>
  </ScalarSidebarSearchButton>

  <SearchModal
    :document
    :hideModels="hideModels"
    :items="items"
    :modalState="modalState"
    @toggleSidebarItem="(id, open) => emit('toggleSidebarItem', id, open)" />
</template>
