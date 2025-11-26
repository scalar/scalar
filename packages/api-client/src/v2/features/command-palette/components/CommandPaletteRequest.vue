<script setup lang="ts">
import {
  ScalarButton,
  ScalarDropdown,
  ScalarDropdownItem,
  ScalarIcon,
  ScalarListbox,
} from '@scalar/components'
import {
  HTTP_METHODS,
  type HttpMethod,
} from '@scalar/helpers/http/http-methods'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import type { TraversedTag } from '@scalar/workspace-store/schemas/navigation'
import { computed, ref } from 'vue'

import HttpMethodBadge from '@/v2/blocks/operation-code-sample/components/HttpMethod.vue'

import CommandActionForm from './CommandActionForm.vue'
import CommandActionInput from './CommandActionInput.vue'

const { workspaceStore, eventBus } = defineProps<{
  workspaceStore: WorkspaceStore
  eventBus: WorkspaceEventBus
}>()

const emits = defineEmits<{
  (event: 'close'): void
  (event: 'back', e: KeyboardEvent): void
}>()

/** All available documents (collections) in the workspace */
const availableDocuments = computed(() =>
  Object.entries(workspaceStore.workspace.documents).map(
    ([name, document]) => ({
      id: name,
      label: document.info.title || name,
    }),
  ),
)

/** Available HTTP methods for the dropdown */
const availableMethods = HTTP_METHODS.map((method) => ({
  id: method,
  label: method.toUpperCase(),
  method,
}))

/**
 * Recursively traverse navigation entries to find all tags.
 */
const getAllTags = (entries: any[]): TraversedTag[] => {
  const tags: TraversedTag[] = []

  for (const entry of entries) {
    if (entry.type === 'tag') {
      tags.push(entry)
    }

    if (entry.children) {
      tags.push(...getAllTags(entry.children))
    }
  }

  return tags
}

/** All available tags for the selected document */
const availableTags = computed(() => {
  if (!selectedDocument.value) {
    return []
  }

  const document = workspaceStore.workspace.documents[selectedDocument.value.id]
  if (!document || !document['x-scalar-navigation']) {
    return []
  }

  const navigation = document['x-scalar-navigation']
  const tags = getAllTags(navigation.children ?? [])

  return [
    { id: '', label: 'No Tag', name: '' },
    ...tags.map((tag) => ({
      id: tag.id,
      label: tag.name,
      name: tag.name,
    })),
  ]
})

const requestPath = ref('/')
const selectedDocument = ref(availableDocuments.value[0] ?? undefined)
const selectedMethod = ref<
  | {
      id: string
      label: string
      method: HttpMethod
    }
  | undefined
>(availableMethods.find((method) => method.method === 'get'))
const selectedTag = ref<
  { id: string; label: string; name: string } | undefined
>(undefined)

/** Handle HTTP method selection from dropdown */
const handleSelectMethod = (
  method:
    | {
        id: string
        label: string
        method: HttpMethod
      }
    | undefined,
) => {
  if (method) {
    selectedMethod.value = method
  }
}

/** Handle tag selection from dropdown */
const handleSelectTag = (
  tag: { id: string; label: string; name: string } | undefined,
) => {
  if (tag) {
    selectedTag.value = tag
  }
}

/** Create the request and navigate to it */
const handleSubmit = () => {
  if (
    !requestPath.value.trim() ||
    !selectedDocument.value ||
    !selectedMethod.value ||
    operationExists.value
  ) {
    return
  }

  const document = workspaceStore.workspace.documents[selectedDocument.value.id]

  if (!document) {
    return
  }

  /** Emit the event to create the operation */
  eventBus.emit('operation:create:operation', {
    documentName: selectedDocument.value.id,
    path: requestPath.value,
    method: selectedMethod.value.method,
    operation: {
      tags: selectedTag.value?.name ? [selectedTag.value.name] : undefined,
    },
  })

  // Close the command palette
  emits('close')
}

/** Check if the operation already exists in the document */
const operationExists = computed(() => {
  if (
    !selectedDocument.value ||
    !selectedMethod.value ||
    !requestPath.value.trim()
  ) {
    return false
  }

  const document = workspaceStore.workspace.documents[selectedDocument.value.id]
  const normalizedPath = requestPath.value.startsWith('/')
    ? requestPath.value
    : `/${requestPath.value}`

  return !!document?.paths?.[normalizedPath]?.[selectedMethod.value.method]
})

/** Disable submit if any required field is missing or operation already exists */
const isDisabled = computed(() => {
  if (!requestPath.value.trim()) {
    return true
  }

  if (!selectedDocument.value) {
    return true
  }

  if (!selectedMethod.value) {
    return true
  }

  /** Disable if the path/method combination already exists */
  if (operationExists.value) {
    return true
  }

  return false
})
</script>
<template>
  <CommandActionForm
    :disabled="isDisabled"
    @submit="handleSubmit">
    <CommandActionInput
      v-model="requestPath"
      label="Request Path"
      placeholder="/users"
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

        <!-- HTTP Method selector -->
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

        <!-- Tag selector -->
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
    <template #submit> Create Request </template>
  </CommandActionForm>
</template>
