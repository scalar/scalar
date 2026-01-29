<script lang="ts">
/**
 * Command Palette Import cURL Component
 *
 * Provides a form for importing API requests from cURL commands.
 * Parses the cURL command to extract the HTTP method, URL, path, headers,
 * and body, then creates a new operation in the selected document.
 *
 * Validates that no conflicting operation exists at the same path/method.
 *
 * @example
 * <CommandPaletteImportCurl
 *   :workspaceStore="workspaceStore"
 *   :eventBus="eventBus"
 *   :curl="curlCommand"
 *   @close="handleClose"
 *   @back="handleBack"
 * />
 */
export default {
  name: 'CommandPaletteImportCurl',
}
</script>

<script setup lang="ts">
import {
  ScalarButton,
  ScalarIcon,
  ScalarListbox,
  type ScalarComboboxOption,
} from '@scalar/components'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

import HttpMethod from '@/v2/blocks/operation-code-sample/components/HttpMethod.vue'
import CommandActionForm from '@/v2/features/command-palette/components/CommandActionForm.vue'
import CommandActionInput from '@/v2/features/command-palette/components/CommandActionInput.vue'
import { getOperationFromCurl } from '@/v2/features/command-palette/helpers/get-operation-from-curl'

const { workspaceStore, inputValue, eventBus } = defineProps<{
  /** The workspace store for accessing documents and operations */
  workspaceStore: WorkspaceStore
  /** Event bus for emitting operation creation events */
  eventBus: WorkspaceEventBus
  /** The cURL command string to parse and import */
  inputValue: string
}>()

const emit = defineEmits<{
  /** Emitted when the import is complete */
  (event: 'close'): void
  /** Emitted when user navigates back (e.g., backspace on empty input) */
  (event: 'back', keyboardEvent: KeyboardEvent): void
}>()

const router = useRouter()

const exampleKey = ref('')

/** Trimmed version of the example key for validation and submission */
const exampleKeyTrimmed = computed<string>(() => exampleKey.value.trim())

/** Parse the cURL command to extract path, method, and operation details */
const { path, method, operation } = getOperationFromCurl(inputValue)

/** List of all available documents (collections) in the workspace */
const documents = computed(() =>
  Object.keys(workspaceStore.workspace.documents).map((document) => ({
    id: document,
    label: document,
  })),
)

const selectedDocument = ref<ScalarComboboxOption | undefined>(
  documents.value[0],
)

/**
 * Check if the form should be disabled.
 * Disabled when:
 * - Example key is empty
 * - No document is selected
 * - An operation with the same path and method already exists in the selected document
 */
const isDisabled = computed<boolean>(() => {
  if (!exampleKeyTrimmed.value || !selectedDocument.value) {
    return true
  }

  /** Prevent creating duplicate operations at the same path/method */
  const document = workspaceStore.workspace.documents[selectedDocument.value.id]
  if (document?.paths?.[path]?.[method]) {
    return true
  }

  return false
})

/**
 * Handle the import submission.
 * Creates a new operation in the selected document from the parsed cURL command.
 */
const handleImportClick = (): void => {
  const documentName = selectedDocument.value

  if (isDisabled.value || !documentName) {
    return
  }

  /** Re-parse with the example key to include it in the operation */
  const result = getOperationFromCurl(inputValue, exampleKeyTrimmed.value)

  eventBus.emit('operation:create:operation', {
    documentName: documentName.id,
    path: result.path,
    method: result.method,
    operation: result.operation,
    exampleKey: exampleKeyTrimmed.value,
    callback: (success) => {
      if (success) {
        // build the sidebar
        workspaceStore.buildSidebar(documentName.id)

        const path = result.path.startsWith('/')
          ? result.path
          : `/${result.path}`

        // navigate to the operation
        router.push({
          name: 'example',
          params: {
            documentSlug: documentName.id,
            pathEncoded: encodeURIComponent(path),
            method: result.method,
            exampleName: exampleKeyTrimmed.value,
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
    @submit="handleImportClick">
    <!-- Example key input -->
    <CommandActionInput
      v-model="exampleKey"
      placeholder="Curl example key (e.g., example-1)"
      @delete="handleBack" />

    <!-- Preview of the parsed cURL request (method + URL + path) -->
    <div class="flex flex-1 flex-col gap-2">
      <div
        class="flex h-9 flex-row items-center gap-2 rounded border p-[3px] text-sm">
        <HttpMethod
          class="border-r-1 px-1"
          :method="method" />
        <span class="scroll-timeline-x whitespace-nowrap">
          {{ operation.servers?.[0]?.url || '' }}{{ path }}
        </span>
      </div>
    </div>

    <!-- Document selector -->
    <template #options>
      <div class="flex items-center gap-2">
        <ScalarListbox
          v-model="selectedDocument"
          :options="documents">
          <ScalarButton
            class="hover:bg-b-2 max-h-8 w-full justify-between gap-1 p-2 text-xs"
            variant="outlined">
            <span
              class="whitespace-nowrap"
              :class="selectedDocument ? 'text-c-1' : 'text-c-3'">
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
      </div>
    </template>

    <template #submit>Import Request</template>
  </CommandActionForm>
</template>
<style scoped>
/**
 * Custom horizontal scroll for the URL preview.
 * Hides scrollbar for a cleaner appearance while maintaining scroll functionality.
 */
.scroll-timeline-x {
  overflow: auto;
  scroll-timeline: --scroll-timeline x;
  /* Firefox support */
  scroll-timeline: --scroll-timeline horizontal;
  /* Hide scrollbar in IE and Edge */
  -ms-overflow-style: none;
  /* Hide scrollbar in Firefox */
  scrollbar-width: none;
}

/* Hide scrollbar in Chrome, Safari, and Opera */
.scroll-timeline-x::-webkit-scrollbar {
  display: none;
}
</style>
