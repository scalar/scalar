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
import { ScalarButton } from '@scalar/components'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import type { TraversedTag } from '@scalar/workspace-store/schemas/navigation'
import { computed, ref } from 'vue'

import type { CommandPaletteDocument } from '../hooks/use-command-palette-documents'
import CommandActionForm from './CommandActionForm.vue'
import CommandActionInput from './CommandActionInput.vue'
import CommandPaletteDocumentSelect from './CommandPaletteDocumentSelect.vue'

const {
  workspaceStore,
  eventBus,
  documentName,
  tag,
  documents,
  activeDocumentName,
} = defineProps<{
  /** The workspace store for accessing documents and tags */
  workspaceStore: WorkspaceStore
  /** Event bus for emitting tag creation events */
  eventBus: WorkspaceEventBus
  /** Preselected document id to create the tag in */
  documentName?: string
  /** When provided, the component enters edit mode with this name pre-filled */
  tag?: TraversedTag
  /**
   * Document options for the dropdown. When omitted we fall back to
   * iterating the workspace store, which keeps the component usable in
   * isolation (e.g. tests) without requiring the full command-palette
   * plumbing.
   */
  documents?: CommandPaletteDocument[]
  /**
   * Document the user is currently viewing. Used as the preselection when
   * the caller does not pass an explicit `documentName`, so opening the
   * palette from inside a document targets that document by default.
   */
  activeDocumentName?: string
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

/**
 * All available documents (collections) for the dropdown. Prefers the
 * explicit `documents` prop (which already groups registry-backed docs by
 * the sidebar's grouping logic) and falls back to a flat workspace-store
 * listing when the prop is omitted.
 */
const availableDocuments = computed<CommandPaletteDocument[]>(() => {
  if (documents) {
    return documents
  }

  return Object.entries(workspaceStore.workspace.documents).map(
    ([name, document]) => ({
      id: name,
      label: document.info.title || name,
    }),
  )
})

/**
 * Returns true when `name` exists somewhere in `availableDocuments` —
 * either as a top-level document id (the active version on a registry
 * group) or inside a group's loaded `versions` list. Both shapes are
 * valid create targets, so we accept either.
 */
const isAvailableDocumentName = (name: string): boolean =>
  availableDocuments.value.some(
    (doc) => doc.id === name || doc.versions?.some((v) => v.id === name),
  )

/**
 * Initial document target. The explicit `documentName` prop wins (set when
 * the palette is opened from a sidebar context menu), falling back to the
 * active document so a Cmd+K-triggered create flow defaults to whatever
 * document the user is currently viewing.
 */
const initialDocumentName = documentName ?? activeDocumentName

const selectedDocumentName = ref<string | undefined>(
  initialDocumentName && isAvailableDocumentName(initialDocumentName)
    ? initialDocumentName
    : (availableDocuments.value[0]?.id ?? undefined),
)

/**
 * Check if the form should be disabled.
 *
 * In edit mode, disabled when:
 * - Tag name is empty
 * - Name is unchanged from the original
 * - The new name conflicts with an existing tag in the same document
 *
 * In create mode, disabled when:
 * - Tag name is empty
 * - No collection is selected
 * - The selected document does not exist
 * - A tag with the same name already exists in the selected document
 */
const isDisabled = computed<boolean>(() => {
  const document =
    workspaceStore.workspace.documents[selectedDocumentName.value ?? '']
  if (!nameTrimmed.value || !selectedDocumentName.value || !document) {
    return true
  }

  // In edit mode, disable if the name has not changed
  if (isEditMode.value) {
    if (nameTrimmed.value === tag?.name) {
      return true
    }
  }

  // Prevent creating duplicate tags with the same name
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
  if (isDisabled.value || !selectedDocumentName.value) {
    return
  }

  const documentName = selectedDocumentName.value

  // In edit mode, emit the new name and close
  if (isEditMode.value && tag) {
    eventBus.emit(
      'tag:edit:tag',
      {
        tag,
        documentName,
        newName: nameTrimmed.value,
      },
      { skipUnpackProxy: true },
    )
    emit('close')
    return
  }

  eventBus.emit('tag:create:tag', {
    name: nameTrimmed.value,
    documentName,
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

    <!-- Collection selector (hidden in edit mode) -->
    <template #options>
      <CommandPaletteDocumentSelect
        v-if="!isEditMode"
        v-model="selectedDocumentName"
        :documents="availableDocuments"
        placeholder="Select Collection"
        searchPlaceholder="Search collections" />

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
