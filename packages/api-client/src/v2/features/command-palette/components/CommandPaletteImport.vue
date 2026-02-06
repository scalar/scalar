<script lang="ts">
/**
 * Command Palette Import Component
 *
 * Provides a form for importing API specifications from various sources:
 * - OpenAPI/Swagger documents (URL, file, or pasted JSON/YAML)
 * - Postman collections (URL, file, or pasted JSON)
 * - cURL commands (automatically redirects to cURL import command)
 *
 * Supports watch mode for URL imports to automatically update when content changes.
 *
 * @example
 * <CommandPaletteImport
 *   :workspaceStore="workspaceStore"
 *   @close="handleClose"
 *   @back="handleBack"
 *   @open-command="handleOpenCommand"
 * />
 */
export default {
  name: 'CommandPaletteImport',
}
</script>

<script setup lang="ts">
import {
  ScalarButton,
  ScalarCodeBlock,
  ScalarIcon,
  ScalarTooltip,
  useLoadingState,
} from '@scalar/components'
import { isLocalUrl } from '@scalar/helpers/url/is-local-url'
import { useToasts } from '@scalar/use-toasts'
import {
  createWorkspaceStore,
  type WorkspaceStore,
} from '@scalar/workspace-store/client'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

import { useFileDialog } from '@/hooks'
import { getOpenApiDocumentDetails } from '@/v2/features/command-palette/helpers/get-openapi-document-details'
import { getPostmanDocumentDetails } from '@/v2/features/command-palette/helpers/get-postman-document-details'
import { importDocumentToWorkspace } from '@/v2/features/command-palette/helpers/import-document-to-workspace'
import { isPostmanCollection } from '@/v2/features/command-palette/helpers/is-postman-collection'
import { loadDocumentFromSource } from '@/v2/features/command-palette/helpers/load-document-from-source'
import { isUrl } from '@/v2/helpers/is-url'

import CommandActionForm from './CommandActionForm.vue'
import CommandActionInput from './CommandActionInput.vue'
import WatchModeToggle from './WatchModeToggle.vue'

const { workspaceStore, eventBus } = defineProps<{
  /** The workspace store for adding documents */
  workspaceStore: WorkspaceStore
  /** Event bus for emitting operation creation events */
  eventBus: WorkspaceEventBus
}>()

const emit = defineEmits<{
  /** Emitted when the import is complete or cancelled */
  (event: 'close'): void
  /** Emitted when user navigates back (e.g., backspace on empty input) */
  (event: 'back', keyboardEvent: KeyboardEvent): void
}>()

const { toast } = useToasts()

const router = useRouter()
const loader = useLoadingState()

const inputContent = ref('')
const watchMode = ref(false)

/** Check if the input content is a URL */
const isUrlInput = computed<boolean>(() => isUrl(inputContent.value))
const isLocalUrlInput = computed<boolean>(
  () => isUrlInput.value && isLocalUrl(inputContent.value),
)

/** Get document details based on the content type (Postman or OpenAPI) */
const documentDetails = computed(() => {
  if (isPostmanCollection(inputContent.value)) {
    return getPostmanDocumentDetails(inputContent.value)
  }
  return getOpenApiDocumentDetails(inputContent.value)
})

/** Get the document type for syntax highlighting */
const documentType = computed<string>(() =>
  documentDetails.value ? documentDetails.value.type : 'json',
)

/** Check if the form should be disabled (when input is empty) */
const isDisabled = computed<boolean>(() => {
  return !inputContent.value.trim()
})

/**
 * Toggle watchMode based on whether the input is a local URL.
 * Only enables watch mode for local URLs, not for files or pasted content.
 */
watch(isLocalUrlInput, (value: boolean) => {
  watchMode.value = value
})

/**
 * Handles errors during the import process.
 * Shows an error toast, invalidates the loader to show an error state,
 * and closes the command palette modal.
 *
 * @param errorMessage - The error message to display and log
 */
const handleImportError = async (errorMessage: string) => {
  // Log the error
  console.error(errorMessage)
  toast(errorMessage, 'error')

  // Invalidate the loader to show the error state
  await loader.invalidate()

  // Close the command palette
  emit('close')
}

/**
 * Directly imports a document into the workspace without showing the modal.
 * This is used when there is only one workspace and it is empty.
 */
const handleImport = async (newSource: string): Promise<void> => {
  loader.start()

  const TEMP_DOCUMENT_NAME = 'drafts'

  // First load the document into a draft store
  // This is to get the title of the document so we can generate a unique slug for store
  const draftStore = createWorkspaceStore({
    meta: {
      /** Ensure we use the active proxy to fetch documents */
      'x-scalar-active-proxy':
        workspaceStore.workspace['x-scalar-active-proxy'],
    },
  })
  const isSuccessfullyLoaded = await loadDocumentFromSource(
    draftStore,
    newSource,
    TEMP_DOCUMENT_NAME,
    watchMode.value,
  )

  if (!isSuccessfullyLoaded) {
    return handleImportError('Failed to import document')
  }

  const importResult = await importDocumentToWorkspace({
    workspaceStore,
    workspaceState: draftStore.exportWorkspace(),
    name: TEMP_DOCUMENT_NAME,
  })

  if (!importResult.ok) {
    return handleImportError(importResult.error)
  }

  // Validate the loader to show the success state
  await loader.validate()

  // Navigate to the document overview page
  navigateToDocument(importResult.slug)

  // Close the command palette
  emit('close')
}

/** Navigate to the document overview page after successful import */
const navigateToDocument = (documentName: string): void => {
  router.push({
    name: 'document.overview',
    params: { documentSlug: documentName },
  })
}

/**
 * Handle file selection and import from file dialog.
 * Reads the file as text and imports it as OpenAPI or Postman collection.
 * Shows loading state during the import process.
 */
const { open: openSpecFileDialog } = useFileDialog({
  onChange: (files) => {
    const [file] = files ?? []

    if (!file) {
      return
    }

    loader.start()

    const onLoad = async (event: ProgressEvent<FileReader>): Promise<void> => {
      const text = event.target?.result as string
      await handleImport(text)
    }

    const reader = new FileReader()
    reader.onload = onLoad
    reader.readAsText(file)
  },
  multiple: false,
  accept: '.json,.yaml,.yml',
})

/**
 * Handle input changes.
 * Detects cURL commands and redirects to the cURL import command.
 */
const handleInput = (value: string): void => {
  /** Redirect to cURL import command if input starts with 'curl' */
  if (value.trim().toLowerCase().startsWith('curl')) {
    return eventBus.emit('ui:open:command-palette', {
      action: 'import-curl-command',
      payload: {
        inputValue: value,
      },
    })
  }

  inputContent.value = value
}

/** Handle back navigation when user presses backspace on empty input */
const handleBack = (event: KeyboardEvent): void => {
  emit('back', event)
}
</script>
<template>
  <CommandActionForm
    :disabled="isDisabled"
    :loader
    @submit="handleImport(inputContent)">
    <!-- URL or cURL input mode -->
    <template v-if="!documentDetails || isUrlInput">
      <CommandActionInput
        :modelValue="inputContent"
        placeholder="OpenAPI/Swagger/Postman URL or cURL"
        @delete="handleBack"
        @update:modelValue="handleInput" />
    </template>

    <!-- Preview mode for pasted content -->
    <template v-else>
      <!-- Preview header with clear button -->
      <div class="flex justify-between">
        <div class="text-c-2 min-h-8 w-full py-2 pl-12 text-center text-xs">
          Preview
        </div>
        <ScalarButton
          class="hover:bg-b-2 relative ml-auto max-h-8 gap-1.5 p-2 text-xs"
          variant="ghost"
          @click="inputContent = ''">
          Clear
        </ScalarButton>
      </div>

      <!-- Code preview with syntax highlighting -->
      <ScalarCodeBlock
        v-if="documentDetails && !isUrlInput"
        class="bg-b-2 mt-1 max-h-[40dvh] rounded border px-2 py-1 text-sm"
        :content="inputContent"
        :copy="false"
        :lang="documentType" />
    </template>

    <!-- Actions: File upload and watch mode toggle -->
    <template #options>
      <div class="flex w-full flex-row items-center justify-between gap-3">
        <!-- File upload button -->
        <ScalarButton
          class="hover:bg-b-2 relative max-h-8 gap-1.5 p-2 text-xs"
          variant="outlined"
          @click="openSpecFileDialog">
          JSON, or YAML File
          <ScalarIcon
            class="text-c-3"
            icon="Upload"
            size="md" />
        </ScalarButton>

        <!-- Watch mode toggle (only enabled for URL imports) -->
        <ScalarTooltip
          :content="
            isUrlInput
              ? 'Watch mode automatically updates the API client when the OpenAPI URL content changes, ensuring your client remains up-to-date.'
              : 'Watch mode is only available for URL imports. When enabled it automatically updates the API client when the OpenAPI URL content changes.'
          "
          placement="bottom">
          <WatchModeToggle
            v-model="watchMode"
            :disabled="!isUrlInput" />
        </ScalarTooltip>
      </div>
    </template>

    <!-- Dynamic submit button text based on import type -->
    <template #submit>
      Import
      <template v-if="isUrlInput">from URL</template>
      <template v-else-if="documentDetails && documentType">
        <template v-if="documentDetails.title">
          "{{ documentDetails.title }}"
        </template>
        <template v-else>
          {{ documentDetails.version }}
        </template>
      </template>
      <template v-else>Collection</template>
    </template>
  </CommandActionForm>
</template>
