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
import type { TraversedTag } from '@scalar/workspace-store/schemas/navigation'
import { computed, ref, type ComputedRef } from 'vue'

import CommandActionForm from './CommandActionForm.vue'
import CommandActionInput from './CommandActionInput.vue'

const { workspaceStore, eventBus, documentName, tag } = defineProps<{
  /** The workspace store for accessing documents and tags */
  workspaceStore: WorkspaceStore
  /** Event bus for emitting tag creation events */
  eventBus: WorkspaceEventBus
  /** Preselected document id to create the tag in */
  documentName?: string
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
  documentName
    ? availableDocuments.value.find((document) => document.id === documentName)
    : (availableDocuments.value[0] ?? undefined),
)

/**
 * Validation message surfaced under the input.
 *
 * Resolves to `null` when the form is valid; otherwise to a human-readable
 * reason the user can act on. Empty input is the default state so we keep
 * the field free of error styling — `isDisabled` still blocks submission
 * there, matching the {@link CommandPaletteOpenApiDocument} pattern.
 *
 * In edit mode, an unchanged name is treated as a no-op (no error shown,
 * but submit stays disabled) so opening the modal does not greet the user
 * with a confusing message about their current name.
 */
const errorMessage: ComputedRef<string | null> = computed(() => {
  if (!nameTrimmed.value) {
    return null
  }

  const document =
    workspaceStore.workspace.documents[selectedDocument.value?.id ?? '']

  if (!selectedDocument.value || !document) {
    return null
  }

  // Unchanged name in edit mode is a silent no-op rather than an error
  if (isEditMode.value && nameTrimmed.value === tag?.name) {
    return null
  }

  if (document.tags?.some((existing) => existing.name === nameTrimmed.value)) {
    return `A tag named "${nameTrimmed.value}" already exists in "${selectedDocument.value.label}". Try a different name.`
  }

  return null
})

/**
 * Submit is blocked while required fields are missing, the name is unchanged
 * in edit mode, or a duplicate tag exists. The inline `errorMessage` makes
 * the duplicate case explicit instead of leaving the user staring at a
 * silently disabled button.
 */
const isDisabled = computed<boolean>(() => {
  const document =
    workspaceStore.workspace.documents[selectedDocument.value?.id ?? '']
  if (!nameTrimmed.value || !selectedDocument.value || !document) {
    return true
  }

  if (isEditMode.value && nameTrimmed.value === tag?.name) {
    return true
  }

  return errorMessage.value !== null
})

/**
 * Handle form submission.
 * In edit mode, emits the new name. In create mode, creates the tag via the event bus.
 */
const handleSubmit = (): void => {
  if (isDisabled.value || !selectedDocument.value) {
    return
  }

  // In edit mode, emit the new name and close
  if (isEditMode.value && tag) {
    eventBus.emit(
      'tag:edit:tag',
      {
        tag,
        documentName: selectedDocument.value.id,
        newName: nameTrimmed.value,
      },
      { skipUnpackProxy: true },
    )
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
  // Do not allow back navigation in edit mode
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

    <p
      v-if="errorMessage"
      class="text-red px-2 pb-1 text-xs"
      data-testid="command-palette-tag-error"
      role="alert">
      {{ errorMessage }}
    </p>

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
