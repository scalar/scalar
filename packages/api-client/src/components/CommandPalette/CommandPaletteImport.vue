<script setup lang="ts">
import {
  ScalarButton,
  ScalarCodeBlock,
  ScalarIcon,
  ScalarTooltip,
  useLoadingState,
} from '@scalar/components'
import { useToasts } from '@scalar/use-toasts'
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

import { useFileDialog } from '@/hooks'
import {
  convertPostmanToOpenApi,
  getOpenApiDocumentDetails,
  getPostmanDocumentDetails,
  isPostmanCollection,
  isUrl,
} from '@/libs'
import { importCurlCommand } from '@/libs/importers/curl'
import { PathId } from '@/router'
import { useWorkspace } from '@/store'
import { useActiveEntities } from '@/store/active-entities'

import CommandActionForm from './CommandActionForm.vue'
import CommandActionInput from './CommandActionInput.vue'
import WatchModeToggle from './WatchModeToggle.vue'

const emits = defineEmits<{
  (event: 'close'): void
  (event: 'back', e: KeyboardEvent): void
}>()

const router = useRouter()

const { activeWorkspace, activeCollection } = useActiveEntities()
const { importSpecFile, importSpecFromUrl, events } = useWorkspace()
const { toast } = useToasts()
const loader = useLoadingState()

const inputContent = ref('')
const watchMode = ref(true)

const documentDetails = computed(() => {
  if (isPostmanCollection(inputContent.value)) {
    return getPostmanDocumentDetails(inputContent.value)
  }
  return getOpenApiDocumentDetails(inputContent.value)
})

const documentType = computed(() =>
  documentDetails.value ? documentDetails.value.type : 'json',
)

function navigateToCollectionPage(collection?: { uid: string }) {
  if (!collection) {
    return
  }

  router.push({
    name: 'collection',
    params: {
      [PathId.Workspace]: activeWorkspace.value?.uid,
      [PathId.Collection]: collection.uid,
    },
  })
}

const isInputUrl = computed(() => isUrl(inputContent.value))
const isInputDocument = computed(() => !!documentDetails.value)

const { open: openSpecFileDialog } = useFileDialog({
  onChange: async (files) => {
    const file = files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = async (e) => {
        const text = e.target?.result as string
        try {
          if (isPostmanCollection(text)) {
            const workspace = await importSpecFile(
              await convertPostmanToOpenApi(text),
              activeWorkspace.value?.uid ?? '',
            )
            navigateToCollectionPage(workspace?.collection)
          } else {
            const workspace = await importSpecFile(
              text,
              activeWorkspace.value?.uid ?? '',
            )
            navigateToCollectionPage(workspace?.collection)
          }
          toast('Import successful', 'info')
          emits('close')
        } catch (error) {
          console.error(error)
          const errorMessage = (error as Error)?.message || 'Unknown error'
          toast(`Import failed: ${errorMessage}`, 'error')
        }
      }
      reader.readAsText(file)
    }
  },
  multiple: false,
  accept: '.json,.yaml,.yml',
})

// Enable watch mode if the input is a URL
watch(isInputUrl, (newVal) => {
  if (!newVal) {
    watchMode.value = false
  }
})

// Disable watch mode if the input is not a URL
watch(inputContent, (newVal) => {
  if (!isUrl(newVal)) {
    watchMode.value = false
  }
})

async function importCollection() {
  if (!inputContent.value || loader.isLoading) {
    return
  }

  loader.startLoading()
  try {
    if (isInputUrl.value) {
      const [error, workspace] = await importSpecFromUrl(
        inputContent.value,
        activeWorkspace.value?.uid ?? '',
        {
          proxyUrl: activeWorkspace.value?.proxyUrl,
          watchMode: watchMode.value,
        },
      )

      navigateToCollectionPage(workspace?.collection)

      if (error) {
        toast(
          'There was a possible CORS error while importing your spec, please make sure this server is allowed in the CORS policy of your OpenAPI document.',
          'error',
          { timeout: 5_000 },
        )
        loader.invalidate(2000, true)
        return
      }
    } else if (isInputDocument.value) {
      if (isPostmanCollection(inputContent.value)) {
        const workspace = await importSpecFile(
          await convertPostmanToOpenApi(inputContent.value),
          activeWorkspace.value?.uid ?? '',
        )
        navigateToCollectionPage(workspace?.collection)
        toast('Successfully converted Postman collection', 'info')
      } else {
        const workspace = await importSpecFile(
          inputContent.value,
          activeWorkspace.value?.uid ?? '',
        )
        navigateToCollectionPage(workspace?.collection)
      }
    } else {
      toast('Import failed: Invalid URL or OpenAPI document', 'error')
      loader.invalidate(2000, true)
      return
    }

    loader.clear()

    emits('close')
    toast('Import successful', 'info')
  } catch (error) {
    console.error('[importCollection]', error)
    const errorMessage = (error as Error)?.message || 'Unknown error'
    loader.invalidate(2000, true)
    toast(`Import failed: ${errorMessage}`, 'error')
  }
}

const handleInput = (value: string) => {
  if (value.trim().toLowerCase().startsWith('curl')) {
    events.commandPalette.emit({
      commandName: 'Import from cURL',
      metaData: {
        parsedCurl: importCurlCommand(value),
        collectionUid: activeCollection.value?.uid,
      },
    })
    return
  }
  inputContent.value = value
}
</script>
<template>
  <CommandActionForm
    :disabled="!inputContent.trim()"
    :loading="loader"
    @submit="importCollection">
    <template v-if="!documentDetails || isUrl(inputContent)">
      <CommandActionInput
        :modelValue="inputContent"
        placeholder="OpenAPI/Swagger/Postman URL or cURL"
        @onDelete="emits('back', $event)"
        @update:modelValue="handleInput" />
    </template>
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
        v-if="documentDetails && !isUrl(inputContent)"
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
            isInputUrl
              ? 'Watch mode automatically updates the API client when the OpenAPI URL content changes, ensuring your client remains up-to-date.'
              : 'Watch mode is only available for URL imports. When enabled it automatically updates the API client when the OpenAPI URL content changes.'
          "
          placement="bottom">
          <WatchModeToggle
            v-model="watchMode"
            :disabled="!isInputUrl" />
        </ScalarTooltip>
      </div>
    </template>
    <template #submit>
      Import
      <template v-if="isInputUrl"> from URL </template>
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
