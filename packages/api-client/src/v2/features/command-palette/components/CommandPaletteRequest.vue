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
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

import HttpMethodBadge from '@/v2/blocks/operation-code-sample/components/HttpMethod.vue'

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

const router = useRouter()

const requestPath = ref('/')
const requestPathTrimmed = computed(() => requestPath.value.trim())

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

/** Available HTTP methods for the dropdown (GET, POST, PUT, etc.) */
const availableMethods: MethodOption[] = HTTP_METHODS.map((method) => ({
  id: method,
  label: method.toUpperCase(),
  method,
}))

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
 * Check if an operation with the same path and method already exists.
 * Used to prevent creating duplicate operations.
 */
const operationExists = computed<boolean>(() => {
  if (
    !selectedDocumentName.value ||
    !selectedMethod.value ||
    !requestPathTrimmed.value
  ) {
    return false
  }

  const document =
    workspaceStore.workspace.documents[selectedDocumentName.value]

  /** Ensure path starts with '/' for consistent lookup */
  const normalizedPath = requestPathTrimmed.value.startsWith('/')
    ? requestPathTrimmed.value
    : `/${requestPathTrimmed.value}`

  return !!document?.paths?.[normalizedPath]?.[selectedMethod.value.method]
})

/**
 * Check if the form should be disabled.
 * Disabled when any required field is missing or operation already exists.
 */
const isDisabled = computed<boolean>(() => {
  if (
    !requestPathTrimmed.value ||
    !selectedDocumentName.value ||
    !selectedMethod.value
  ) {
    return true
  }

  /** Prevent creating duplicate operations */
  if (operationExists.value) {
    return true
  }

  return false
})

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
      if (success) {
        /** Build the sidebar */
        workspaceStore.buildSidebar(documentName)

        const path = requestPathTrimmed.value.startsWith('/')
          ? requestPathTrimmed.value
          : `/${requestPathTrimmed.value}`

        /** Navigate to the example */
        router.push({
          name: 'example',
          params: {
            documentSlug: documentName,
            pathEncoded: encodeURIComponent(path),
            method: selectedMethod.value?.method,
            exampleName: 'default',
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
    <!-- Request path input -->
    <CommandActionInput
      v-model="requestPath"
      label="Request Path"
      placeholder="/users"
      @delete="handleBack" />

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
