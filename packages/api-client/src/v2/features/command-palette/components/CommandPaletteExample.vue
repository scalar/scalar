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
import type { TraversedOperation } from '@scalar/workspace-store/schemas/navigation'
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

import HttpMethodBadge from '@/v2/blocks/operation-code-sample/components/HttpMethod.vue'

import CommandActionForm from './CommandActionForm.vue'
import CommandActionInput from './CommandActionInput.vue'

const { workspaceStore } = defineProps<{
  workspaceStore: WorkspaceStore
}>()

const emits = defineEmits<{
  (event: 'close'): void
  (event: 'back', e: KeyboardEvent): void
}>()

const router = useRouter()

/** All available documents (collections) in the workspace */
const availableDocuments = computed(() =>
  Object.entries(workspaceStore.workspace.documents).map(
    ([name, document]) => ({
      id: name,
      label: document.info.title || name,
    }),
  ),
)

const exampleName = ref('')
const selectedDocument = ref(availableDocuments.value[0] ?? undefined)
const selectedOperation = ref<
  | {
      id: string
      label: string
      path: string
      method: HttpMethod
    }
  | undefined
>(undefined)

/**
 * Recursively traverse navigation entries to find all operations.
 * Operations can be nested under tags or at the document level.
 */
const getAllOperations = (entries: any[]): TraversedOperation[] => {
  const operations: TraversedOperation[] = []

  for (const entry of entries) {
    if (entry.type === 'operation') {
      operations.push(entry)
    }

    if (entry.children) {
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

/** Reset operation selection when document changes */
watch(
  selectedDocument,
  () => {
    selectedOperation.value = availableOperations.value[0] ?? undefined
  },
  { immediate: true },
)

/** Handle operation selection from dropdown */
const handleSelect = (
  operation:
    | {
        id: string
        label: string
        path: string
        method: HttpMethod
      }
    | undefined,
) => {
  if (operation) {
    selectedOperation.value = operation
  }
}

/** Navigate to the example route which will create it automatically */
const createExample = () => {
  if (isDisabled.value || !selectedDocument.value || !selectedOperation.value) {
    return
  }

  router.push({
    name: 'example',
    params: {
      documentSlug: selectedDocument.value.id,
      pathEncoded: encodeURIComponent(selectedOperation.value.path),
      method: selectedOperation.value.method,
      exampleName: exampleName.value,
    },
  })

  emits('close')
}

/** Disable submit if any required field is missing */
const isDisabled = computed(() => {
  if (!exampleName.value.trim()) {
    return true
  }

  if (!selectedDocument.value) {
    return true
  }

  if (!selectedOperation.value) {
    return true
  }

  return false
})
</script>
<template>
  <CommandActionForm
    :disabled="isDisabled"
    @submit="createExample">
    <CommandActionInput
      v-model="exampleName"
      label="Example Name"
      placeholder="Example Name"
      @onDelete="emits('back', $event)" />
    <template #options>
      <div class="flex flex-1 gap-1">
        <!-- Document selector -->
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

        <!-- Operation selector -->
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
    <template #submit> Create Example </template>
  </CommandActionForm>
</template>
