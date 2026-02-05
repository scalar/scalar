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
import { normalize } from '@scalar/openapi-parser'
import type { UnknownObject } from '@scalar/types/utils'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import { generateUniqueValue } from '@scalar/workspace-store/helpers/generate-unique-value'
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

import { useFileDialog } from '@/hooks'
import { getOpenApiDocumentDetails } from '@/v2/features/command-palette/helpers/get-openapi-document-details'
import { getOpenApiFromPostman } from '@/v2/features/command-palette/helpers/get-openapi-from-postman'
import { getPostmanDocumentDetails } from '@/v2/features/command-palette/helpers/get-postman-document-details'
import { isPostmanCollection } from '@/v2/features/command-palette/helpers/is-postman-collection'
import { isUrl } from '@/v2/helpers/is-url'
import { slugify } from '@/v2/helpers/slugify'

import CommandActionForm from './CommandActionForm.vue'
import CommandActionInput from './CommandActionInput.vue'
import WatchModeToggle from './WatchModeToggle.vue'

/** Result type for import operations */
type ImportResult = { success: true; name: string } | { success: false }

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

/** Maximum number of attempts to generate a unique document name */
const MAX_NAME_RETRIES = 100

/** Default document name when none can be extracted */
const DEFAULT_DOCUMENT_NAME = 'document'

const router = useRouter()
const loader = useLoadingState()

const inputContent = ref('')
const watchMode = ref(false)

/** Check if the input content is a URL */
const isUrlInput = computed<boolean>(() => isUrl(inputContent.value))

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
watch(isUrlInput, (isUrl: boolean) => {
  watchMode.value = isUrl && isLocalUrl(inputContent.value)
})

/**
 * Validate that a document name does not already exist in the workspace.
 * Used to ensure unique document names during import.
 */
const isDocumentNameUnique = (name: string): boolean => {
  return !Object.keys(workspaceStore.workspace.documents).includes(name)
}

/**
 * Generate a unique document name based on a default value.
 * Uses slugification and retries to ensure uniqueness.
 * Returns undefined if no unique name could be generated after max retries.
 */
const generateUniqueDocumentName = async (
  defaultValue: string,
): Promise<string | undefined> => {
  return await generateUniqueValue({
    defaultValue,
    validation: isDocumentNameUnique,
    maxRetries: MAX_NAME_RETRIES,
    transformation: slugify,
  })
}

/**
 * Extract the title from an OpenAPI document object.
 * Returns the default document name if title cannot be found or is not a string.
 */
const extractDocumentTitle = (document: UnknownObject): string => {
  if (
    typeof document.info === 'object' &&
    document.info !== null &&
    'title' in document.info &&
    typeof document.info.title === 'string'
  ) {
    return document.info.title
  }
  return DEFAULT_DOCUMENT_NAME
}

/**
 * Import content from a URL, Postman collection, or OpenAPI document.
 * Handles three types of imports:
 * 1. URL - Creates a document with watch mode support
 * 2. Postman collection - Converts to OpenAPI first
 * 3. OpenAPI document - Imports directly
 */
const importContents = async (content: string): Promise<ImportResult> => {
  /** Import from URL with optional watch mode */
  if (isUrl(content)) {
    const name = await generateUniqueDocumentName(DEFAULT_DOCUMENT_NAME)

    if (!name) {
      console.error('Failed to generate a unique name')
      return { success: false }
    }

    const success = await workspaceStore.addDocument({
      name,
      url: content,
      meta: {
        'x-scalar-watch-mode': watchMode.value,
      },
    })

    return { success, name }
  }

  /** Import from Postman collection (convert to OpenAPI first) */
  if (isPostmanCollection(content)) {
    const document = getOpenApiFromPostman(content)
    const defaultName = document.info?.title ?? DEFAULT_DOCUMENT_NAME
    const name = await generateUniqueDocumentName(defaultName)

    if (!name) {
      console.error('Failed to generate a unique name')
      return { success: false }
    }

    const success = await workspaceStore.addDocument({
      name,
      document,
    })

    return { success, name }
  }

  /** Import from OpenAPI document (JSON or YAML) */
  const document = normalize(content) as UnknownObject
  const defaultName = extractDocumentTitle(document)
  const name = await generateUniqueDocumentName(defaultName)

  if (!name) {
    console.error('Failed to generate a unique name')
    return { success: false }
  }

  const success = await workspaceStore.addDocument({
    name,
    document,
  })

  return { success, name }
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
 */
const { open: openSpecFileDialog } = useFileDialog({
  onChange: (files) => {
    const [file] = files ?? []

    if (!file) {
      return
    }

    const onLoad = async (event: ProgressEvent<FileReader>): Promise<void> => {
      const text = event.target?.result as string
      const result = await importContents(text)

      if (result.success) {
        navigateToDocument(result.name)
      }

      emit('close')
    }

    const reader = new FileReader()
    reader.onload = onLoad
    reader.readAsText(file)
  },
  multiple: false,
  accept: '.json,.yaml,.yml',
})

/**
 * Handle the import submission.
 * Shows loading state during import and navigates on success.
 */
const handleImport = async (): Promise<void> => {
  loader.start()

  const result = await importContents(inputContent.value)

  /** Clear loading state or show error */
  if (result.success) {
    await loader.clear()
    navigateToDocument(result.name)
  } else {
    await loader.invalidate()
  }

  emit('close')
}

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
    @submit="handleImport">
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
