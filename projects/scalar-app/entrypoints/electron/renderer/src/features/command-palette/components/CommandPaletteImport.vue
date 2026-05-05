<!--
  Custom CommandPaletteImport component that uses window.api.openFilePicker
  instead of a file upload slot
-->
<script setup lang="ts">
import { CommandPaletteImport as BaseCommandPaletteImport } from '@scalar/api-client/v2/features/command-palette'
import { ScalarButton } from '@scalar/components'
import { ScalarIconUpload } from '@scalar/icons'
import { type WorkspaceStore } from '@scalar/workspace-store/client'
import { type WorkspaceEventBus } from '@scalar/workspace-store/events'
import { ref } from 'vue'

import { readFiles } from '@/loaders/read-files'

const { workspaceStore, eventBus } = defineProps<{
  /** The workspace store for adding documents */
  workspaceStore: WorkspaceStore
  /** Event bus for emitting operation creation events */
  eventBus: WorkspaceEventBus
}>()

const emit = defineEmits<{
  /** Emitted when the import is complete or cancelled */
  (event: 'close'): void
  /** Emitted when user navigates back (e.g., backspace on empty input) */
  (event: 'back', keyboardEvent: KeyboardEvent): void
}>()

const isLoading = ref(false)

async function handleFilePicker(
  importFn: (source: string, type: 'file' | 'raw') => Promise<void>,
) {
  isLoading.value = true

  try {
    const filePath = await window.api.openFilePicker()

    if (filePath) {
      console.log('loading from file', filePath)
      await importFn(filePath, 'file')
    }
  } catch (error) {
    console.error('Error opening file picker:', error)
  } finally {
    isLoading.value = false
  }
}

const fileLoader = readFiles()
</script>

<template>
  <BaseCommandPaletteImport
    :eventBus="eventBus"
    :fileLoader
    :workspaceStore="workspaceStore"
    @back="(e) => emit('back', e)"
    @close="emit('close')">
    <template #fileUpload="{ import: importFn }">
      <ScalarButton
        class="hover:bg-b-2 relative max-h-8 gap-1.5 p-2 text-xs"
        variant="outlined"
        @click="handleFilePicker(importFn)">
        JSON, or YAML File
        <ScalarIconUpload
          class="text-c-3"
          size="md" />
      </ScalarButton>
    </template>
  </BaseCommandPaletteImport>
</template>
