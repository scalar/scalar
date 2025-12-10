<script lang="ts">
/**
 * Command Palette Tag Component
 *
 * Provides a form for creating a new tag in a document (collection).
 * Tags are used to organize and group related API operations.
 *
 * Validates that the tag name does not already exist in the selected document
 * to prevent duplicates.
 *
 * @example
 * <CommandPaletteTag
 *   :workspaceStore="workspaceStore"
 *   :eventBus="eventBus"
 *   @close="handleClose"
 *   @back="handleBack"
 * />
 */
export default {
  name: 'CommandPaletteTag',
}
</script>

<script setup lang="ts">
import { ScalarButton, ScalarIcon, ScalarListbox } from '@scalar/components'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import { computed, ref } from 'vue'

import CommandActionForm from './CommandActionForm.vue'
import CommandActionInput from './CommandActionInput.vue'

const { workspaceStore, eventBus, documentId } = defineProps<{
  /** The workspace store for accessing documents and tags */
  workspaceStore: WorkspaceStore
  /** Event bus for emitting tag creation events */
  eventBus: WorkspaceEventBus
  /** Preselected document id to create the tag in */
  documentId?: string
}>()

const emit = defineEmits<{
  /** Emitted when the tag is created successfully */
  (event: 'close'): void
  /** Emitted when user navigates back (e.g., backspace on empty input) */
  (event: 'back', keyboardEvent: KeyboardEvent): void
}>()

const name = ref('')
const nameTrimmed = computed(() => name.value.trim())

/** All available documents (collections) in the workspace */
const availableDocuments = computed(() =>
  Object.entries(workspaceStore.workspace.documents).map(
    ([name, document]) => ({
      id: name,
      label: document.info.title || name,
    }),
  ),
)

const selectedDocument = ref<{ id: string; label: string } | undefined>(
  documentId
    ? availableDocuments.value.find((document) => document.id === documentId)
    : (availableDocuments.value[0] ?? undefined),
)

/**
 * Check if the form should be disabled.
 * Disabled when:
 * - Tag name is empty
 * - No collection is selected
 * - The selected document does not exist
 * - A tag with the same name already exists in the selected document
 */
const isDisabled = computed<boolean>(() => {
  if (!nameTrimmed.value || !selectedDocument.value) {
    return true
  }

  const document = workspaceStore.workspace.documents[selectedDocument.value.id]

  /** Prevent submission if the document does not exist */
  if (!document) {
    return true
  }

  /** Prevent creating duplicate tags with the same name */
  if (document.tags?.some((tag) => tag.name === nameTrimmed.value)) {
    return true
  }

  return false
})

/**
 * Create the tag and close the command palette.
 * Emits an event to create a new tag in the selected document.
 */
const handleSubmit = (): void => {
  if (isDisabled.value || !selectedDocument.value) {
    return
  }

  eventBus.emit('tag:create:tag', {
    name: nameTrimmed.value,
    documentName: selectedDocument.value.id,
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
    <!-- Tag name input -->
    <CommandActionInput
      v-model="name"
      label="Tag Name"
      placeholder="Tag Name"
      @delete="handleBack" />

    <!-- Collection selector -->
    <template #options>
      <ScalarListbox
        v-model="selectedDocument"
        :options="availableDocuments">
        <ScalarButton
          class="hover:bg-b-2 max-h-8 w-fit justify-between gap-1 p-2 text-xs"
          variant="outlined">
          <span :class="selectedDocument ? 'text-c-1' : 'text-c-3'">
            {{
              selectedDocument ? selectedDocument.label : 'Select Collection'
            }}
          </span>
          <ScalarIcon
            class="text-c-3"
            icon="ChevronDown"
            size="md" />
        </ScalarButton>
      </ScalarListbox>
    </template>

    <template #submit>Create Tag</template>
  </CommandActionForm>
</template>
