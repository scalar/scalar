<script setup lang="ts">
import { useFileDialog } from '@/hooks'
import { useWorkspace } from '@/store'
import { ScalarButton, ScalarIcon } from '@scalar/components'
import { useToasts } from '@scalar/use-toasts'
import { ref } from 'vue'

import CommandActionForm from './CommandActionForm.vue'
import CommandActionInput from './CommandActionInput.vue'

const emits = defineEmits<{
  (event: 'close'): void
  (event: 'back', e: KeyboardEvent): void
}>()

const { activeWorkspace, importSpecFile, importSpecFromUrl } = useWorkspace()
const specUrl = ref('')
const { toast } = useToasts()

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

const handleSubmit = async () => {
  if (specUrl.value) {
    try {
      await importSpecFromUrl(specUrl.value)
      toast('Import successful', 'info')
      emits('close')
    } catch (error) {
      console.error('the error ', error)
      const errorMessage = (error as Error)?.message || 'Unknown error'
      toast(`Import failed: ${errorMessage}`, 'error')
    }
  }
}
</script>
<template>
  <CommandActionForm @submit="handleSubmit">
    <CommandActionInput
      v-model="specUrl"
      label="Paste Swagger File URL"
      placeholder="Paste Swagger File URL"
      @onDelete="emits('back', $event)" />
    <template #options>
      <ScalarButton
        class="p-2 max-h-8 gap-1 text-xs hover:bg-b-2 relative"
        variant="outlined"
        @click="openSpecFileDialog">
        JSON, or YAML Files
        <ScalarIcon
          class="text-c-3 -rotate-90"
          icon="ArrowRight"
          size="sm" />
      </ScalarButton>
    </template>
    <template #submit>Import Collection</template>
  </CommandActionForm>
</template>
