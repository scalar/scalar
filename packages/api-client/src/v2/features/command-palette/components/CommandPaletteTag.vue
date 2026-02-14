<script lang="ts">
/**
 * Command Palette Tag Component
 *
 * Provides a form for creating or editing a tag in a document (collection).
 * Tags are used to organize and group related API operations.
 *
 * When `tag` is provided, the component enters edit mode where:
 * - The name input is pre-filled with the current tag name
 * - The collection selector is hidden (tag already belongs to a document)
 * - A cancel button is shown to close the modal without saving
 * - Back navigation is disabled (cannot go back with backspace)
 * - Submitting emits an 'edit' event instead of creating a new tag
 *
 * In create mode, validates that the tag name does not already exist
 * in the selected document to prevent duplicates.
 *
 * @example
 * // Create mode
 * <CommandPaletteTag
 *   :workspaceStore="workspaceStore"
 *   :eventBus="eventBus"
 *   @close="handleClose"
 *   @back="handleBack"
 * />
 *
 * // Edit mode
 * <CommandPaletteTag
 *   :workspaceStore="workspaceStore"
 *   :eventBus="eventBus"
 *   :tag="tag"
 *   @close="handleClose"
 *   @edit="handleEdit"
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
import { unpackProxyObject } from '@scalar/workspace-store/helpers/unpack-proxy'
import type { TraversedTag } from '@scalar/workspace-store/schemas/navigation'
import { computed, ref } from 'vue'

import CommandActionForm from './CommandActionForm.vue'
import CommandActionInput from './CommandActionInput.vue'

const { workspaceStore, eventBus, documentId, tag } = defineProps<{
  /** The workspace store for accessing documents and tags */
  workspaceStore: WorkspaceStore
  /** Event bus for emitting tag creation events */
  eventBus: WorkspaceEventBus
  /** Preselected document id to create the tag in */
  documentId?: string
  /** When provided, the component enters edit mode with this name pre-filled */
  tag?: TraversedTag
}>()

const emit = defineEmits<{
  /** Emitted when the tag is created or edited successfully */
  (event: 'close'): void
  /** Emitted when user navigates back (e.g., backspace on empty input) */
  (event: 'back', keyboardEvent: KeyboardEvent): void
}>()

const isEditMode = computed(() => tag !== undefined)

const name = ref(tag?.name ?? '')
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
 *
 * In edit mode, disabled when the name is empty or unchanged.
 *
 * In create mode, disabled when:
 * - Tag name is empty
 * - No collection is selected
 * - The selected document does not exist
 * - A tag with the same name already exists in the selected document
 */
const isDisabled = computed<boolean>(() => {
  if (!nameTrimmed.value) {
    return true
  }

  /** In edit mode, only require a non-empty name that differs from the original */
  if (isEditMode.value) {
    return nameTrimmed.value === tag?.name
  }

  if (!selectedDocument.value) {
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
 * Handle form submission.
 * In edit mode, emits the new name. In create mode, creates the tag via the event bus.
 */
const handleSubmit = (): void => {
  if (isDisabled.value || !selectedDocument.value) {
    return
  }

  /** In edit mode, emit the new name and close */
  if (isEditMode.value && tag) {
    eventBus.emit('tag:edit:tag', {
      tag: unpackProxyObject(tag),
      documentName: selectedDocument.value.id,
      newName: nameTrimmed.value,
    })
    emit('close')
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
  /** Do not allow back navigation in edit mode */
  if (isEditMode.value) {
    return
  }
  emit('back', event)
}

/** Handle cancel action in edit mode */
const handleCancel = (): void => {
  emit('close')
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

    <!-- Collection selector (hidden in edit mode) -->
    <template #options>
      <ScalarListbox
        v-if="!isEditMode"
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

      <!-- Cancel button in edit mode -->
      <ScalarButton
        v-if="isEditMode"
        class="max-h-8 px-3 text-xs"
        variant="outlined"
        @click="handleCancel">
        Cancel
      </ScalarButton>
    </template>

    <template #submit>{{ isEditMode ? 'Save' : 'Create Tag' }}</template>
  </CommandActionForm>
</template>
