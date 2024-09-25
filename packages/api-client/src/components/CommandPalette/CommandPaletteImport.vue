<script setup lang="ts">
import { useFileDialog } from '@/hooks'
import { getOpenApiDocumentDetails, isUrl } from '@/libs'
import { useWorkspace } from '@/store'
import {
  ScalarButton,
  ScalarCodeBlock,
  ScalarIcon,
  useLoadingState,
} from '@scalar/components'
import { useToasts } from '@scalar/use-toasts'
import { computed, ref } from 'vue'

import CommandActionForm from './CommandActionForm.vue'
import CommandActionInput from './CommandActionInput.vue'

const emits = defineEmits<{
  (event: 'close'): void
  (event: 'back', e: KeyboardEvent): void
}>()

const { activeWorkspace, importSpecFile, importSpecFromUrl } = useWorkspace()
const { toast } = useToasts()
const loader = useLoadingState()
const inputContent = ref('')

const documentDetails = computed(() =>
  getOpenApiDocumentDetails(inputContent.value),
)

const documentType = computed(() =>
  documentDetails.value ? documentDetails.value.type : 'json',
)

const isInputUrl = computed(() => isUrl(inputContent.value))
const isInputDocument = computed(() => !!documentDetails.value)
const liveSync = ref(false)

const { open: openSpecFileDialog } = useFileDialog({
  onChange: async (files) => {
    const file = files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = async (e) => {
        const text = e.target?.result as string
        try {
          await importSpecFile(text, activeWorkspace.value.uid)
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

async function importCollection() {
  if (!inputContent.value || loader.isLoading) return

  loader.startLoading()
  try {
    if (isInputUrl.value)
      await importSpecFromUrl(inputContent.value, activeWorkspace.value.uid, {
        proxy: activeWorkspace.value.proxyUrl,
        liveSync: liveSync.value,
      })
    else if (isInputDocument.value)
      await importSpecFile(
        String(inputContent.value),
        activeWorkspace.value.uid,
      )
    else {
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
</script>
<template>
  <CommandActionForm
    :disabled="!inputContent.trim()"
    :loading="loader"
    @submit="importCollection">
    <template v-if="!documentDetails || isUrl(inputContent)">
      <CommandActionInput
        v-model="inputContent"
        placeholder="Paste Swagger/OpenAPI File URL or content"
        @onDelete="emits('back', $event)" />
    </template>
    <template v-else>
      <div class="flex justify-between">
        <div class="pl-8 text-xs min-h-8 py-2 text-c-2">Preview</div>
        <ScalarButton
          class="ml-auto p-2 max-h-8 gap-1.5 text-xs hover:bg-b-2 relative"
          variant="ghost"
          @click="inputContent = ''">
          Clear
        </ScalarButton>
      </div>
      <ScalarCodeBlock
        v-if="documentDetails && !isUrl(inputContent)"
        class="border max-h-[40dvh] mt-1 bg-b-2 rounded [--scalar-small:--scalar-font-size-4]"
        :content="inputContent"
        :copy="false"
        :lang="documentType" />
    </template>
    <template #options>
      <ScalarButton
        class="p-2 max-h-8 gap-1.5 text-xs hover:bg-b-2 relative"
        variant="outlined"
        @click="openSpecFileDialog">
        JSON, or YAML File
        <ScalarIcon
          class="text-c-3"
          icon="UploadSimple"
          size="md" />
      </ScalarButton>
    </template>
    <template #submit>
      Import
      <template v-if="isInputUrl"> from URL </template>
      <template v-else-if="documentDetails && documentType">
        <template v-if="documentDetails.title">
          "{{ documentDetails.title }}"
        </template>
        <template v-else>{{ documentDetails.version }} Spec</template>
      </template>
      <template v-else>Collection</template>
    </template>
  </CommandActionForm>
</template>
