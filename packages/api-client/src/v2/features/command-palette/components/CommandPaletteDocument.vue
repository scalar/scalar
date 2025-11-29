<script lang="ts">
/**
 * Command Palette Document Component
 *
 * Provides a form for creating a new empty document in the workspace.
 * Users can name the document and select an icon before creation.
 * Validates that the name is not empty and not already in use.
 *
 * @example
 * <CommandPaletteDocument
 *   :workspaceStore="workspaceStore"
 *   :eventBus="eventBus"
 *   @close="handleClose"
 *   @back="handleBack"
 * />
 */
export default {}
</script>

<script setup lang="ts">
import { ScalarButton } from '@scalar/components'
import { LibraryIcon } from '@scalar/icons/library'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

import IconSelector from '@/components/IconSelector.vue'

import CommandActionForm from './CommandActionForm.vue'
import CommandActionInput from './CommandActionInput.vue'

const { workspaceStore, eventBus } = defineProps<{
  /** The workspace store for accessing existing documents */
  workspaceStore: WorkspaceStore
  /** Event bus for emitting document creation events */
  eventBus: WorkspaceEventBus
}>()

const emit = defineEmits<{
  /** Emitted when the document is created successfully */
  (event: 'close'): void
  /** Emitted when user navigates back (e.g., backspace on empty input) */
  (event: 'back', keyboardEvent: KeyboardEvent): void
}>()

const router = useRouter()

const documentName = ref('')
const documentNameTrimmed = computed(() => documentName.value.trim())

/** Default icon for new documents (folder icon) */
const documentIcon = ref('interface-content-folder')

/**
 * Check if the form should be disabled.
 * Disabled when the name is empty or when a document with that name already exists.
 */
const isDisabled = computed<boolean>(() => {
  if (!documentNameTrimmed.value) {
    return true
  }

  /** Prevent duplicate document names in the workspace */
  if (
    workspaceStore.workspace.documents[documentNameTrimmed.value] !== undefined
  ) {
    return true
  }

  return false
})

/** Handle form submission to create a new document */
const handleSubmit = (): void => {
  if (isDisabled.value) {
    return
  }

  eventBus.emit('document:create:empty-document', {
    name: documentNameTrimmed.value,
    icon: documentIcon.value,
    callback: (success) => {
      if (success) {
        router.push({
          name: 'document.overview',
          params: {
            documentSlug: documentNameTrimmed.value,
          },
        })
      }
    },
  })

  emit('close')
}

/** Handle back navigation when user presses backspace on empty input */
const handleBack = (event: KeyboardEvent): void => {
  emit('back', event)
}
</script>

<template>
  <CommandActionForm
    :disabled="isDisabled"
    @submit="handleSubmit">
    <CommandActionInput
      v-model="documentName"
      label="Document Name"
      placeholder="Document Name"
      @delete="handleBack" />

    <!-- Icon selector for choosing document icon -->
    <template #options>
      <IconSelector
        v-model="documentIcon"
        placement="bottom-start">
        <ScalarButton
          class="aspect-square h-auto px-0"
          variant="outlined">
          <LibraryIcon
            class="text-c-2 size-4 stroke-[1.75]"
            :src="documentIcon" />
        </ScalarButton>
      </IconSelector>
    </template>

    <template #submit>Create Document</template>
  </CommandActionForm>
</template>
