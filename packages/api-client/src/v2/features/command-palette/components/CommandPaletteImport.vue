<script setup lang="ts">
import {
  ScalarButton,
  ScalarCodeBlock,
  ScalarIcon,
  ScalarTooltip,
  useLoadingState,
} from '@scalar/components'
import { normalize } from '@scalar/openapi-parser'
import type { UnknownObject } from '@scalar/types/utils'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import { generateUniqueValue } from '@scalar/workspace-store/helpers/generate-unique-value'
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

import { useFileDialog } from '@/hooks'
import { getOpenApiDocumentDetails } from '@/v2/features/command-palette/helpers/get-openapi-document-details'
import { getOpenapiFromPostman } from '@/v2/features/command-palette/helpers/get-openapi-from-postman'
import { getPostmanDocumentDetails } from '@/v2/features/command-palette/helpers/get-postman-collection-details'
import { isPostmanCollection } from '@/v2/features/command-palette/helpers/is-postman-collection'
import type { UiCommandIds } from '@/v2/features/command-palette/hooks/use-command-palette-state'
import { isUrl } from '@/v2/helpers/is-url'
import { slugify } from '@/v2/helpers/slugify'

import CommandActionForm from './CommandActionForm.vue'
import CommandActionInput from './CommandActionInput.vue'
import WatchModeToggle from './WatchModeToggle.vue'

const { workspaceStore } = defineProps<{
  workspaceStore: WorkspaceStore
}>()

const emits = defineEmits<{
  (event: 'close'): void
  (event: 'back', e: KeyboardEvent): void
  (
    event: 'open-command',
    id: UiCommandIds,
    props: Record<string, unknown>,
  ): void
}>()

const router = useRouter()

const loader = useLoadingState()

const inputContent = ref('')
const watchMode = ref(true)

const isUrlInput = computed(() => isUrl(inputContent.value))

const documentDetails = computed(() => {
  if (isPostmanCollection(inputContent.value)) {
    return getPostmanDocumentDetails(inputContent.value)
  }
  return getOpenApiDocumentDetails(inputContent.value)
})

const documentType = computed(() =>
  documentDetails.value ? documentDetails.value.type : 'json',
)

/** Watch for changes to isUrlInput and toggle watchMode accordingly */
watch(isUrlInput, (newVal) => {
  if (!newVal) {
    watchMode.value = false
    return
  }
  watchMode.value = true
})

const importContents = async (
  content: string,
): Promise<{ success: true; name: string } | { success: false }> => {
  const validate = (value: string) => {
    return !Object.keys(workspaceStore.workspace.documents).includes(value)
  }

  if (isUrl(content)) {
    const name = await generateUniqueValue({
      defaultValue: 'document',
      validation: validate,
      maxRetries: 100,
      transformation: slugify,
    })

    if (!name) {
      console.error('Failed to generate a unique name')
      return {
        success: false,
      }
    }

    const success = await workspaceStore.addDocument({
      name,
      url: content,
      meta: {
        'x-scalar-watch-mode': watchMode.value,
      },
    })

    return {
      success,
      name,
    }
  }

  // Import from postman collection
  if (isPostmanCollection(content)) {
    const document = getOpenapiFromPostman(content)
    const name = await generateUniqueValue({
      defaultValue: document.info?.title ?? 'document',
      validation: validate,
      maxRetries: 100,
      transformation: slugify,
    })

    if (!name) {
      console.error('Failed to generate a unique name')
      return {
        success: false,
      }
    }

    const success = await workspaceStore.addDocument({
      name,
      document,
    })

    return {
      success,
      name,
    }
  }

  const document = normalize(content) as UnknownObject

  const title =
    typeof document.info === 'object' &&
    document.info !== null &&
    'title' in document.info
      ? document.info.title
      : undefined

  const name = await generateUniqueValue({
    defaultValue: typeof title === 'string' ? title : 'document',
    validation: validate,
    maxRetries: 100,
    transformation: slugify,
  })

  if (!name) {
    console.error('Failed to generate a unique name')
    return {
      success: false,
    }
  }

  // Import from openapi document
  const success = await workspaceStore.addDocument({
    name,
    document,
  })

  return {
    success,
    name,
  }
}

const navigateToDocument = (documentName: string) => {
  router.push({
    name: 'document.overview',
    params: { documentSlug: documentName },
  })
}

const { open: openSpecFileDialog } = useFileDialog({
  onChange: (files) => {
    const [file] = files ?? []

    if (!file) {
      return
    }

    const onLoad = async (e: ProgressEvent<FileReader>) => {
      const text = e.target?.result as string
      const result = await importContents(text)
      if (result.success) {
        navigateToDocument(result.name)
      }

      emits('close')
    }

    const reader = new FileReader()
    reader.onload = onLoad
    reader.readAsText(file)
  },
  multiple: false,
  accept: '.json,.yaml,.yml',
})

async function handleImport() {
  loader.startLoading()

  const clear = async (success: boolean) => {
    if (success) {
      await loader.clear()
      // Nagivate to the new document
      return
    }

    await loader.invalidate(2000, true)
  }

  const result = await importContents(inputContent.value)
  await clear(result.success)

  // If the import was successful, navigate to the new document
  if (result.success) {
    navigateToDocument(result.name)
  }

  emits('close')
}

const handleInput = (value: string) => {
  if (value.trim().toLowerCase().startsWith('curl')) {
    // Import from cURL
    return emits('open-command', 'import-curl-command', {
      curl: value,
    })
  }
  inputContent.value = value
}
</script>
<template>
  <CommandActionForm
    :disabled="!inputContent.trim()"
    :loading="loader"
    @submit="handleImport">
    <!-- URL input -->
    <template v-if="!documentDetails || isUrlInput">
      <CommandActionInput
        :modelValue="inputContent"
        placeholder="OpenAPI/Swagger/Postman URL or cURL"
        @onDelete="emits('back', $event)"
        @update:modelValue="handleInput" />
    </template>
    <!-- File input -->
    <template v-else>
      <!-- OpenAPI document preview -->
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
      <ScalarCodeBlock
        v-if="documentDetails && !isUrlInput"
        class="bg-b-2 mt-1 max-h-[40dvh] rounded border px-2 py-1 text-sm"
        :content="inputContent"
        :copy="false"
        :lang="documentType" />
    </template>
    <template #options>
      <div class="flex w-full flex-row items-center justify-between gap-3">
        <!-- Upload -->
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

        <!-- Watch -->
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
    <template #submit>
      Import
      <template v-if="isUrlInput"> from URL </template>
      <template v-else-if="documentDetails && documentType">
        <template v-if="documentDetails.title">
          "{{ documentDetails.title }}"
        </template>
        <template v-else>
          {{ documentDetails.version }}
        </template>
      </template>
      <template v-else> Collection </template>
    </template>
  </CommandActionForm>
</template>
