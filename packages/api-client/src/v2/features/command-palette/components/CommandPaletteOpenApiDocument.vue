<script lang="ts">
/**
 * Command Palette OpenAPI Document Component
 *
 * Provides a form for creating a new empty document in the workspace.
 * Users can name the document and select an icon before creation.
 * Validates that the name is not empty and not already in use.
 *
 * @example
 * <CommandPaletteOpenApiDocument
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
import { computed, ref, type ComputedRef } from 'vue'
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
 * Validation message surfaced under the input.
 *
 * Resolves to `null` when the form is valid; otherwise to a human-readable
 * reason the user can act on. Empty input is the default state so we keep
 * the field free of error styling - `isDisabled` still blocks submission
 * there, matching the `CreateVersionModal` pattern.
 */
const errorMessage: ComputedRef<string | null> = computed(() => {
  if (!documentNameTrimmed.value) {
    return null
  }

  if (
    workspaceStore.workspace.documents[documentNameTrimmed.value] !== undefined
  ) {
    return `A document named "${documentNameTrimmed.value}" already exists. Try a different name.`
  }

  return null
})

/**
 * Submit is blocked while the input is empty or fails validation. We keep the
 * button disabled (rather than letting the user fire a no-op submit) because
 * the inline `errorMessage` already explains the fix out loud.
 */
const isDisabled = computed<boolean>(
  () => !documentNameTrimmed.value || errorMessage.value !== null,
)

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

    <p
      v-if="errorMessage"
      class="text-red px-2 pb-1 text-xs"
      data-testid="command-palette-document-error"
      role="alert">
      {{ errorMessage }}
    </p>

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
