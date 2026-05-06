<script lang="ts">
/**
 * Command Palette Example Component
 *
 * Provides a form for creating a new example for an API operation.
 * Users can name the example, select a document (collection), and choose an operation.
 * Automatically navigates to the example route which creates the example.
 *
 * @example
 * <CommandPaletteExample
 *   :workspaceStore="workspaceStore"
 *   @close="handleClose"
 *   @back="handleBack"
 * />
 */
export default {
  name: 'CommandPaletteExample',
}
</script>

<script setup lang="ts">
import { HttpMethod as HttpMethodBadge } from '@scalar/api-client/blocks/operation-code-sample'
import {
  CommandActionForm,
  CommandActionInput,
} from '@scalar/api-client/features/command-palette'
import {
  ScalarButton,
  ScalarDropdown,
  ScalarDropdownItem,
  ScalarIcon,
} from '@scalar/components'
import type { HttpMethod } from '@scalar/helpers/http/http-methods'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import type {
  TraversedEntry,
  TraversedExample,
  TraversedOperation,
} from '@scalar/workspace-store/schemas/navigation'
import { computed, ref, watch, type ComputedRef } from 'vue'

import { useCommandPaletteDocumentSelection } from '../hooks/use-command-palette-document-selection'
import type { CommandPaletteDocument } from '../hooks/use-command-palette-documents'
import CommandPaletteDocumentSelect from './CommandPaletteDocumentSelect.vue'

const {
  workspaceStore,
  eventBus,
  documentName,
  operationId,
  example,
  documents,
  activeDocumentName,
} = defineProps<{
  /** The workspace store for accessing documents and operations */
  workspaceStore: WorkspaceStore
  /** Event bus for emitting operation creation events */
  eventBus: WorkspaceEventBus
  /** Document id to create the example for */
  documentName?: string
  /** Preselected path and method to create the example for */
  operationId?: string
  /** Existing example for edit mode */
  example?: TraversedExample
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
  /** Emitted when the example is created successfully */
  (event: 'close'): void
  /** Emitted when user navigates back (e.g., backspace on empty input) */
  (event: 'back', keyboardEvent: KeyboardEvent): void
}>()

/** Operation option type for selectors */
type OperationOption = {
  id: string
  label: string
  path: string
  method: HttpMethod
  exampleNames: string[]
}

const isEditMode = computed(() => example !== undefined)

const exampleName = ref(example?.name ?? '')
const exampleNameTrimmed = computed(() => exampleName.value.trim())

const { availableDocuments, selectedDocumentName } =
  useCommandPaletteDocumentSelection({
    workspaceStore,
    documents: () => documents,
    documentName: () => documentName,
    activeDocumentName: () => activeDocumentName,
  })

/**
 * Recursively traverse navigation entries to find all operations.
 * Operations can be nested under tags or at the document level.
 */
const getAllOperations = (entries: TraversedEntry[]): TraversedOperation[] => {
  const operations: TraversedOperation[] = []

  for (const entry of entries) {
    if (entry.type === 'operation') {
      operations.push(entry)
    }

    /** Recursively traverse child entries if they exist */
    if ('children' in entry && entry.children) {
      operations.push(...getAllOperations(entry.children))
    }
  }

  return operations
}

/** All available operations for the selected document */
const availableOperations = computed(() => {
  if (!selectedDocumentName.value) {
    return []
  }

  const document =
    workspaceStore.workspace.documents[selectedDocumentName.value]
  if (!document || !document['x-scalar-navigation']) {
    return []
  }

  const navigation = document['x-scalar-navigation']
  const operations = getAllOperations(navigation.children ?? [])

  return operations.map((operation) => ({
    id: operation.id,
    label: `${operation.method.toUpperCase()} ${operation.path}`,
    path: operation.path,
    method: operation.method,
    exampleNames:
      operation.children
        ?.filter((child): child is TraversedExample => child.type === 'example')
        .map((child) => child.name) ?? [],
  }))
})

const selectedOperation = ref<OperationOption | undefined>(
  operationId
    ? availableOperations.value.find(
        (operation) => operation.id === operationId,
      )
    : undefined,
)

/** Reset operation selection when the document target changes */
watch(
  selectedDocumentName,
  () => {
    selectedOperation.value = operationId
      ? availableOperations.value.find(
          (operation) => operation.id === operationId,
        )
      : (availableOperations.value[0] ?? undefined)
  },
  { immediate: true },
)

/** Handle operation selection from dropdown */
const handleSelect = (operation: OperationOption | undefined): void => {
  if (operation) {
    selectedOperation.value = operation
  }
}

/**
 * Validation message surfaced under the input.
 *
 * Resolves to `null` when the form is valid; otherwise to a human-readable
 * reason the user can act on. Empty input or an unchanged name in edit mode
 * are treated as the default state so the modal does not greet the user
 * with a misleading error.
 */
const errorMessage: ComputedRef<string | null> = computed(() => {
  if (
    !exampleNameTrimmed.value ||
    !selectedDocumentName.value ||
    !selectedOperation.value
  ) {
    return null
  }

  if (isEditMode.value && exampleNameTrimmed.value === example?.name) {
    return null
  }

  const nameConflict = selectedOperation.value.exampleNames.some(
    (name) => name === exampleNameTrimmed.value && name !== example?.name,
  )

  if (nameConflict) {
    return `An example named "${exampleNameTrimmed.value}" already exists for ${selectedOperation.value.method.toUpperCase()} ${selectedOperation.value.path}. Try a different name.`
  }

  return null
})

/**
 * Submit is blocked while required fields are missing, the name is unchanged
 * in edit mode, or another example already uses the same name. The inline
 * `errorMessage` explains the duplicate case so the user knows how to recover.
 */
const isDisabled = computed<boolean>(() => {
  if (
    !exampleNameTrimmed.value ||
    !selectedDocumentName.value ||
    !selectedOperation.value
  ) {
    return true
  }

  if (isEditMode.value && exampleNameTrimmed.value === example?.name) {
    return true
  }

  return errorMessage.value !== null
})

/**
 * Navigate to the example route which will create it automatically.
 * The route handler will create the example with the provided details.
 */
const handleSubmit = (): void => {
  if (
    isDisabled.value ||
    !selectedDocumentName.value ||
    !selectedOperation.value
  ) {
    return
  }

  const documentName = selectedDocumentName.value

  if (isEditMode.value && example) {
    eventBus.emit('operation:rename:example', {
      documentName,
      meta: {
        path: selectedOperation.value.path,
        method: selectedOperation.value.method,
        exampleKey: example.name,
      },
      payload: {
        name: exampleNameTrimmed.value,
      },
    })
    emit('close')
    return
  }

  eventBus.emit('operation:create:draft-example', {
    documentName,
    meta: {
      path: selectedOperation.value.path,
      method: selectedOperation.value.method,
    },
    exampleName: exampleNameTrimmed.value,
  })

  emit('close')
}

/** Handle back navigation when user presses backspace on empty input */
const handleBack = (event: KeyboardEvent): void => {
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
    <CommandActionInput
      v-model="exampleName"
      label="Example Name"
      placeholder="Example Name"
      @delete="handleBack" />

    <p
      v-if="errorMessage"
      class="text-red px-2 pb-1 text-xs"
      data-testid="command-palette-example-error"
      role="alert">
      {{ errorMessage }}
    </p>

    <!-- Selectors for document and operation -->
    <template #options>
      <div
        v-if="!isEditMode"
        class="flex flex-1 gap-1">
        <!-- Document (collection) selector with built-in version picker -->
        <CommandPaletteDocumentSelect
          v-model="selectedDocumentName"
          :documents="availableDocuments"
          placeholder="Select Document"
          searchPlaceholder="Search documents"
          triggerClass="w-[150px] min-w-[150px]" />

        <!-- Operation selector (path + method) -->
        <ScalarDropdown
          placement="bottom"
          resize>
          <ScalarButton
            class="hover:bg-b-2 max-h-8 w-full justify-between gap-1 p-2 text-xs"
            :disabled="!availableOperations.length"
            variant="outlined">
            <span
              v-if="selectedOperation"
              class="text-c-1 truncate">
              {{ selectedOperation.path }}
            </span>
            <span
              v-else
              class="text-c-3">
              Select Operation
            </span>
            <div class="flex items-center gap-2">
              <HttpMethodBadge
                v-if="selectedOperation"
                :method="selectedOperation.method" />
              <ScalarIcon
                class="text-c-3"
                icon="ChevronDown"
                size="md" />
            </div>
          </ScalarButton>

          <!-- Dropdown list of all operations -->
          <template #items>
            <div class="custom-scroll max-h-40">
              <ScalarDropdownItem
                v-for="operation in availableOperations"
                :key="operation.id"
                class="flex h-7 w-full items-center justify-between px-1 pr-[26px]"
                @click="handleSelect(operation)">
                <span class="truncate">{{ operation.path }}</span>
                <HttpMethodBadge :method="operation.method" />
              </ScalarDropdownItem>
            </div>
          </template>
        </ScalarDropdown>
      </div>

      <ScalarButton
        v-else
        class="max-h-8 px-3 text-xs"
        variant="outlined"
        @click="handleCancel">
        Cancel
      </ScalarButton>
    </template>

    <template #submit>{{ isEditMode ? 'Save' : 'Create Example' }}</template>
  </CommandActionForm>
</template>
