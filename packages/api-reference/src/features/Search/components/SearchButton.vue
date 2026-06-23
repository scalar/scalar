<script setup lang="ts">
import { ScalarIconButton } from '@scalar/components/icon-button'
import { useModal } from '@scalar/components/modal'
import { ScalarSidebarSearchButton } from '@scalar/components/sidebar'
import { isMacOS } from '@scalar/helpers/general/is-mac-os'
import { ScalarIconMagnifyingGlass } from '@scalar/icons'
import {
  DEFAULT_MODELS_SECTION_LABEL,
  type ModelsSectionLabel,
} from '@scalar/types/api-reference'
import type { AsyncApiDocument } from '@scalar/types/asyncapi/3.1'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import type { OpenApiDocument } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

import { useApiReferenceI18n } from '@/features/i18n'

import SearchModal from './SearchModal.vue'

const {
  searchHotKey = 'k',
  modelsSectionLabel = DEFAULT_MODELS_SECTION_LABEL,
} = defineProps<{
  forceIcon?: boolean
  searchHotKey?: string
  hideModels?: boolean
  modelsSectionLabel?: ModelsSectionLabel
  document?: OpenApiDocument | AsyncApiDocument
  eventBus: WorkspaceEventBus
}>()

const button = ref<InstanceType<typeof ScalarSidebarSearchButton>>()
const modalState = useModal()
const { translate } = useApiReferenceI18n()

/**
 * Whether the user is on macOS, used to show the correct shortcut symbol.
 *
 * This must default to `false` so the server-rendered markup and the first
 * client render agree. Detecting the platform relies on `navigator`, which is
 * unavailable during SSR, so we resolve it after mount to avoid a hydration
 * mismatch.
 */
const isMac = ref(false)
onMounted(() => {
  isMac.value = isMacOS()
})

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
    :label="translate('search.label')"
    @click="handleClick" />
  <ScalarSidebarSearchButton
    v-else
    ref="button"
    class="w-full"
    :class="$attrs.class"
    :shortcutLabel="translate('search.keyboardShortcut')"
    @click="handleClick">
    <span class="sr-only">{{ translate('search.open') }}</span>
    <span
      aria-hidden="true"
      class="sidebar-search-placeholder">
      {{ translate('search.label') }}
    </span>
    <template #shortcut>
      <template v-if="isMac">
        <span class="sr-only">{{ translate('search.command') }}</span>
        <span aria-hidden="true">⌘</span>
      </template>
      <template v-else>
        <span class="sr-only">{{ translate('search.control') }}</span>
        <span aria-hidden="true">⌃</span>
      </template>
      {{ searchHotKey }}
    </template>
  </ScalarSidebarSearchButton>

  <SearchModal
    :document
    :eventBus="eventBus"
    :modalState="modalState"
    :modelsSectionLabel="modelsSectionLabel" />
</template>
