<script lang="ts">
/**
 * Command Palette Request Component
 *
 * Provides a form for creating a new API request (operation) in a document.
 * Users can specify the request path, HTTP method, document (collection),
 * and optionally assign it to a tag.
 *
 * Validates that no operation with the same path and method already exists
 * in the selected document to prevent duplicates.
 *
 * @example
 * <CommandPaletteRequest
 *   :workspaceStore="workspaceStore"
 *   :eventBus="eventBus"
 *   @close="handleClose"
 *   @back="handleBack"
 * />
 */
export default {
  name: 'CommandPaletteRequest',
}
</script>

<script setup lang="ts">
import {
  ScalarButton,
  ScalarDropdown,
  ScalarDropdownItem,
  ScalarIcon,
} from '@scalar/components'
import {
  HTTP_METHODS,
  type HttpMethod,
} from '@scalar/helpers/http/http-methods'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import { computed, ref, watch, type ComputedRef } from 'vue'

import HttpMethodBadge from '@/v2/blocks/operation-code-sample/components/HttpMethod.vue'

import { useCommandPaletteDocumentSelection } from '../hooks/use-command-palette-document-selection'
import type { CommandPaletteDocument } from '../hooks/use-command-palette-documents'
import CommandActionForm from './CommandActionForm.vue'
import CommandActionInput from './CommandActionInput.vue'
import CommandPaletteDocumentSelect from './CommandPaletteDocumentSelect.vue'

const {
  workspaceStore,
  eventBus,
  documentName,
  tagId,
  documents,
  activeDocumentName,
} = defineProps<{
  /** The workspace store for accessing documents and operations */
  workspaceStore: WorkspaceStore
  /** Event bus for emitting operation creation events */
  eventBus: WorkspaceEventBus
  /** Preselected document id to create the request in */
  documentName?: string
  /** Preselected tag id to add the request to (optional) */
  tagId?: string
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
  /** Emitted when the request is created successfully */
  (event: 'close'): void
  /** Emitted when user navigates back (e.g., backspace on empty input) */
  (event: 'back', keyboardEvent: KeyboardEvent): void
}>()

/** HTTP method option type for selectors */
type MethodOption = {
  id: string
  label: string
  method: HttpMethod
}

/** Tag option type for selectors */
type TagOption = {
  id: string
  label: string
}

const requestPath = ref('/')
const requestPathTrimmed = computed(() => requestPath.value.trim())

/** Ensure path starts with '/' for consistent lookup */
const normalizedRequestPath = computed<string>(() =>
  requestPathTrimmed.value.startsWith('/')
    ? requestPathTrimmed.value
    : `/${requestPathTrimmed.value}`,
)

const { availableDocuments, selectedDocumentName } =
  useCommandPaletteDocumentSelection({
    workspaceStore,
    documents: () => documents,
    documentName: () => documentName,
    activeDocumentName: () => activeDocumentName,
  })

/** Available HTTP methods for the dropdown (GET, POST, PUT, etc.) */
const availableMethods: MethodOption[] = HTTP_METHODS.map((method) => ({
  id: method,
  label: method.toUpperCase(),
  method,
}))

const selectedMethod = ref<MethodOption | undefined>(
  availableMethods.find((method) => method.method === 'get'),
)

/**
 * All available tags for the selected document.
 * Includes a "No Tag" option for operations without a tag assignment.
 */
const availableTags = computed<TagOption[]>(() => {
  if (!selectedDocumentName.value) {
    return []
  }

  const document =
    workspaceStore.workspace.documents[selectedDocumentName.value]
  if (!document) {
    return []
  }

  return [
    { id: '', label: 'No Tag' },
    ...(document.tags?.map((tag) => ({
      id: tag.name,
      label: tag.name,
    })) ?? []),
  ]
})

const selectedTag = ref<TagOption | undefined>(
  tagId ? availableTags.value.find((tag) => tag.id === tagId) : undefined,
)

// Reset the selected tag to the "No Tag" option when the document
// changes, since tag lists are scoped to a single document.
watch(selectedDocumentName, () => {
  selectedTag.value = availableTags.value.find((tag) => tag.id === '')
})

/**
 * Validation message surfaced under the input.
 *
 * Resolves to `null` when the form is valid; otherwise to a human-readable
 * reason the user can act on. Empty input is the default state so we keep
 * the field free of error styling — `isDisabled` still blocks submission
 * there, matching the {@link CommandPaletteOpenApiDocument} pattern.
 */
const errorMessage: ComputedRef<string | null> = computed(() => {
  if (
    !requestPathTrimmed.value ||
    !selectedDocumentName.value ||
    !selectedMethod.value
  ) {
    return null
  }

  const document =
    workspaceStore.workspace.documents[selectedDocumentName.value]
  const method = selectedMethod.value.method

  if (document?.paths?.[normalizedRequestPath.value]?.[method]) {
    const documentLabel =
      availableDocuments.value.find(
        (doc) =>
          doc.id === selectedDocumentName.value ||
          doc.versions?.some((v) => v.id === selectedDocumentName.value),
      )?.label ?? selectedDocumentName.value

    return `A ${method.toUpperCase()} operation at "${normalizedRequestPath.value}" already exists in "${documentLabel}". Try a different path or method.`
  }

  return null
})

/**
 * Submit is blocked while required fields are missing or a duplicate exists.
 * The inline `errorMessage` explains the duplicate case so the user knows how
 * to recover instead of facing a silently disabled button.
 */
const isDisabled = computed<boolean>(
  () =>
    !requestPathTrimmed.value ||
    !selectedDocumentName.value ||
    !selectedMethod.value ||
    errorMessage.value !== null,
)

/** Handle HTTP method selection from dropdown */
const handleSelectMethod = (method: MethodOption | undefined): void => {
  if (method) {
    selectedMethod.value = method
  }
}

/** Handle tag selection from dropdown */
const handleSelectTag = (tag: TagOption | undefined): void => {
  if (tag) {
    selectedTag.value = tag
  }
}

/**
 * Create the request and close the command palette.
 * Emits an event to create a new operation with the specified details.
 */
const handleSubmit = (): void => {
  if (
    isDisabled.value ||
    !selectedDocumentName.value ||
    !selectedMethod.value
  ) {
    return
  }

  const documentName = selectedDocumentName.value
  const document = workspaceStore.workspace.documents[documentName]

  if (!document) {
    return
  }

  eventBus.emit('operation:create:operation', {
    documentName,
    path: requestPathTrimmed.value,
    method: selectedMethod.value.method,
    operation: {
      tags: selectedTag.value?.id ? [selectedTag.value.id] : undefined,
    },
    callback: (success) => {
      if (!success) {
        return
      }

      /** Build the sidebar */
      workspaceStore.buildSidebar(documentName)

      /** Navigate to the example via the event bus rather than the router */
      eventBus.emit('ui:navigate', {
        page: 'example',
        documentSlug: documentName,
        path: normalizedRequestPath.value,
        method: selectedMethod.value?.method ?? 'get',
        exampleName: 'default',
      })
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
    <!-- Request path input -->
    <CommandActionInput
      v-model="requestPath"
      label="Request Path"
      placeholder="/users"
      @delete="handleBack" />

    <p
      v-if="errorMessage"
      class="text-red px-2 pb-1 text-xs"
      data-testid="command-palette-request-error"
      role="alert">
      {{ errorMessage }}
    </p>

    <!-- Selectors for document, method, and tag -->
    <template #options>
      <div class="flex flex-1 gap-1">
        <!-- Document (collection) selector with built-in version picker -->
        <CommandPaletteDocumentSelect
          v-model="selectedDocumentName"
          :documents="availableDocuments"
          placeholder="Select Document"
          searchPlaceholder="Search documents"
          triggerClass="w-[150px] min-w-[150px]" />

        <!-- HTTP method selector (GET, POST, PUT, etc.) -->
        <ScalarDropdown
          placement="bottom"
          resize>
          <ScalarButton
            class="hover:bg-b-2 max-h-8 w-[100px] min-w-[100px] justify-between gap-1 p-2 text-xs"
            variant="outlined">
            <div class="flex items-center gap-2">
              <HttpMethodBadge
                v-if="selectedMethod"
                :method="selectedMethod.method" />
              <ScalarIcon
                class="text-c-3"
                icon="ChevronDown"
                size="md" />
            </div>
          </ScalarButton>

          <!-- Dropdown list of all HTTP methods -->
          <template #items>
            <div class="custom-scroll max-h-40">
              <ScalarDropdownItem
                v-for="method in availableMethods"
                :key="method.id"
                class="flex h-7 w-full items-center justify-center px-1"
                @click="handleSelectMethod(method)">
                <HttpMethodBadge :method="method.method" />
              </ScalarDropdownItem>
            </div>
          </template>
        </ScalarDropdown>

        <!-- Tag selector (optional) for organizing operations -->
        <ScalarDropdown
          placement="bottom"
          resize>
          <ScalarButton
            class="hover:bg-b-2 max-h-8 w-full justify-between gap-1 p-2 text-xs"
            :disabled="!availableTags.length"
            variant="outlined">
            <span :class="selectedTag ? 'text-c-1 truncate' : 'text-c-3'">
              {{ selectedTag ? selectedTag.label : 'Select Tag (Optional)' }}
            </span>
            <ScalarIcon
              class="text-c-3"
              icon="ChevronDown"
              size="md" />
          </ScalarButton>

          <!-- Dropdown list of available tags -->
          <template #items>
            <div class="custom-scroll max-h-40">
              <ScalarDropdownItem
                v-for="tag in availableTags"
                :key="tag.id"
                class="flex h-7 w-full items-center px-1"
                @click="handleSelectTag(tag)">
                <span class="truncate">{{ tag.label }}</span>
              </ScalarDropdownItem>
            </div>
          </template>
        </ScalarDropdown>
      </div>
    </template>

    <template #submit>Create Request</template>
  </CommandActionForm>
</template>
