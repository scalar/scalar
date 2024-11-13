<script setup lang="ts">
import CommandActionForm from '@/components/CommandPalette/CommandActionForm.vue'
import CommandActionInput from '@/components/CommandPalette/CommandActionInput.vue'
import { useFileDialog } from '@/hooks'
import { getOpenApiDocumentDetails, isUrl } from '@/libs'
import { useWorkspace } from '@/store'
import {
  ScalarButton,
  ScalarCodeBlock,
  ScalarIcon,
  useLoadingState,
} from '@scalar/components'
import { fetchSpecFromUrl } from '@scalar/oas-utils/helpers'
import { convert } from '@scalar/postman-to-openapi'
import { useToasts } from '@scalar/use-toasts'
import { computed, ref } from 'vue'

const emits = defineEmits<{
  (event: 'close'): void
  (event: 'back', e: KeyboardEvent): void
}>()

console.log(convert)

const { toast } = useToasts()
const loader = useLoadingState()
const inputContent = ref('')

const { activeWorkspace, importSpecFile, importSpecFromUrl } = useWorkspace()

const isInputUrl = computed(() => isUrl(inputContent.value))

const { open: openSpecFileDialog } = useFileDialog({
  onChange: async (files) => {
    const file = files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = async (e) => {
        const text = e.target?.result as string
        try {
          importCollection(text) // await importSpecFile(text, activeWorkspace.value.uid)
          toast('Import successful', 'info')
          // emits('close')
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

async function importCollection(text?: string) {
  loader.startLoading()
  const urlData = isInputUrl.value
    ? await fetchSpecFromUrl(inputContent.value)
    : undefined
  const value = urlData || text || inputContent.value
  if (!value) return
  console.log('marc', value)
  const result = convert(JSON.parse(value))
  console.log('result', result)
  await importSpecFile(result, activeWorkspace.value.uid)

  emits('close')
  toast('Import successful', 'info')
  loader.stopLoading()
}
</script>
<template>
  <CommandActionForm
    :disabled="!inputContent.trim()"
    :loading="loader"
    @submit="importCollection">
    <template v-if="!isUrl(inputContent)">
      <CommandActionInput
        v-model="inputContent"
        placeholder="OpenAPI/Swagger URL or document"
        @onDelete="emits('back', $event)" />
    </template>
    <template v-else>
      <!-- OpenAPI document preview -->
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
        v-if="!isUrl(inputContent)"
        class="border max-h-[40dvh] mt-1 bg-b-2 rounded [--scalar-small:--scalar-font-size-4]"
        :content="inputContent"
        :copy="false"
        lang="json" />
    </template>
    <template #options>
      <div class="flex flex-row items-center justify-between gap-3 w-full">
        <!-- Upload -->
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
      </div>
    </template>
    <template #submit>
      Import
      <template v-if="isInputUrl"> from URL </template>
      <template v-else>Collection</template>
    </template>
  </CommandActionForm>
</template>
