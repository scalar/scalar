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
import {
  ScalarButton,
  ScalarDropdown,
  ScalarDropdownItem,
  ScalarIcon,
  ScalarListbox,
} from '@scalar/components'
import type { HttpMethod } from '@scalar/helpers/http/http-methods'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import type {
  TraversedEntry,
  TraversedOperation,
} from '@scalar/workspace-store/schemas/navigation'
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

import HttpMethodBadge from '@/v2/blocks/operation-code-sample/components/HttpMethod.vue'

import CommandActionForm from './CommandActionForm.vue'
import CommandActionInput from './CommandActionInput.vue'

const { workspaceStore, documentId, operationId } = defineProps<{
  /** The workspace store for accessing documents and operations */
  workspaceStore: WorkspaceStore
  /** Document id to create the example for */
  documentId?: string
  /** Preselected path and method to create the example for */
  operationId?: string
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
}

const router = useRouter()

const exampleName = ref('')
const exampleNameTrimmed = computed(() => exampleName.value.trim())

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
  if (!selectedDocument.value) {
    return []
  }

  const document = workspaceStore.workspace.documents[selectedDocument.value.id]
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
  }))
})

const selectedOperation = ref<OperationOption | undefined>(
  operationId
    ? availableOperations.value.find(
        (operation) => operation.id === operationId,
      )
    : undefined,
)

/** Reset operation selection when document changes */
watch(
  selectedDocument,
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
 * Check if the form should be disabled.
 * Disabled when any required field is missing or empty.
 */
const isDisabled = computed<boolean>(() => {
  if (
    !exampleNameTrimmed.value ||
    !selectedDocument.value ||
    !selectedOperation.value
  ) {
    return true
  }

  return false
})

/**
 * Navigate to the example route which will create it automatically.
 * The route handler will create the example with the provided details.
 */
const createExample = (): void => {
  if (isDisabled.value || !selectedDocument.value || !selectedOperation.value) {
    return
  }

  router.push({
    name: 'example',
    params: {
      documentSlug: selectedDocument.value.id,
      pathEncoded: encodeURIComponent(selectedOperation.value.path),
      method: selectedOperation.value.method,
      exampleName: exampleNameTrimmed.value,
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
    @submit="createExample">
    <CommandActionInput
      v-model="exampleName"
      label="Example Name"
      placeholder="Example Name"
      @delete="handleBack" />

    <!-- Selectors for document and operation -->
    <template #options>
      <div class="flex flex-1 gap-1">
        <!-- Document (collection) selector -->
        <ScalarListbox
          v-model="selectedDocument"
          :options="availableDocuments">
          <ScalarButton
            class="hover:bg-b-2 max-h-8 w-[150px] min-w-[150px] justify-between gap-1 p-2 text-xs"
            variant="outlined">
            <span :class="selectedDocument ? 'text-c-1 truncate' : 'text-c-3'">
              {{
                selectedDocument ? selectedDocument.label : 'Select Document'
              }}
            </span>
            <ScalarIcon
              class="text-c-3"
              icon="ChevronDown"
              size="md" />
          </ScalarButton>
        </ScalarListbox>

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
    </template>

    <template #submit>Create Example</template>
  </CommandActionForm>
</template>
