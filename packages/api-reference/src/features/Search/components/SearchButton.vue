<script setup lang="ts">
import { ScalarSidebarSearchButton, useModal } from '@scalar/components'
import { isMacOS } from '@scalar/helpers/general/is-mac-os'
import type { AsyncApiDocument } from '@scalar/workspace-store/schemas/asyncapi/v3.0/asyncapi-document'
import type { OpenApiDocument } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

import SearchModal from './SearchModal.vue'

const { searchHotKey = 'k', hideModels = false } = defineProps<{
  searchHotKey?: string
  hideModels?: boolean
  document?: OpenApiDocument | AsyncApiDocument
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
  (next, prev) => {
    // Return focus to the button when the modal is closed
    if (!next && prev) {
      nextTick(() => {
        button.value?.$el.focus()
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
    :modalState="modalState" />
</template>
