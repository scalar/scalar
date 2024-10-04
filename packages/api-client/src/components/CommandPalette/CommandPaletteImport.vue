<script setup lang="ts">
import { useFileDialog } from '@/hooks'
import { getOpenApiDocumentVersion, isDocument, isUrl } from '@/libs'
import { useWorkspace } from '@/store'
import { ScalarButton, ScalarCodeBlock, ScalarIcon } from '@scalar/components'
import { useToasts } from '@scalar/use-toasts'
import { ref } from 'vue'

import CommandActionForm from './CommandActionForm.vue'
import CommandActionInput from './CommandActionInput.vue'

const emits = defineEmits<{
  (event: 'close'): void
  (event: 'back', e: KeyboardEvent): void
}>()

const { activeWorkspace, importSpecFile, importSpecFromUrl } = useWorkspace()
const { toast } = useToasts()
const inputContent = ref('')

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
  try {
    if (inputContent.value) {
      if (isUrl(inputContent.value)) {
        await importSpecFromUrl(
          inputContent.value,
          undefined,
          undefined,
          activeWorkspace.value.uid,
        )
      } else if (isDocument(inputContent.value)) {
        await importSpecFile(
          String(inputContent.value),
          activeWorkspace.value.uid,
        )
      } else {
        toast('Import failed: Invalid URL or OpenAPI document', 'error')
      }
    }
    emits('close')
    toast('Import successful', 'info')
  } catch (error) {
    console.error('[importCollection]', error)
    const errorMessage = (error as Error)?.message || 'Unknown error'
    toast(`Import failed: ${errorMessage}`, 'error')
  }
}

function getOpenApiDocumentType() {
  const version = getOpenApiDocumentVersion(inputContent.value)
  if (version) return version.type
  else return 'json'
}
</script>
<template>
  <CommandActionForm
    :disabled="!inputContent.trim()"
    @submit="importCollection">
    <template
      v-if="!getOpenApiDocumentVersion(inputContent) || isUrl(inputContent)">
      <CommandActionInput
        v-model="inputContent"
        placeholder="Paste Swagger/OpenAPI File URL or content"
        @onDelete="emits('back', $event)" />
    </template>
    <template v-else>
      <ScalarButton
        class="ml-auto p-2 max-h-8 gap-1.5 text-xs hover:bg-b-2 relative"
        variant="ghost"
        @click="inputContent = ''">
        Clear
      </ScalarButton>
      <ScalarCodeBlock
        v-if="getOpenApiDocumentVersion(inputContent) && !isUrl(inputContent)"
        class="bg-backdropdark border max-h-[25dvh] mt-2 rounded"
        :content="inputContent"
        :copy="false"
        :lang="getOpenApiDocumentType()" />
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
    <template #submit>Import Collection</template>
  </CommandActionForm>
</template>
