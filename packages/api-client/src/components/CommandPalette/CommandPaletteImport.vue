<script setup lang="ts">
import { useFileDialog } from '@/hooks'
import { useWorkspace } from '@/store/workspace'
import { ScalarButton, ScalarIcon } from '@scalar/components'
import { onBeforeUnmount, onMounted, ref } from 'vue'

import { handleKeyDown } from './handleKeyDown'

const emits = defineEmits<{
  (event: 'close'): void
}>()

const { activeWorkspace, importSpecFile, importSpecFromUrl } = useWorkspace()
const specUrl = ref('')

const { open: openSpecFileDialog } = useFileDialog({
  onChange: async (files) => {
    const file = files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = async (e) => {
        const text = e.target?.result as string
        importSpecFile(text, activeWorkspace.value.uid)
        handleSubmit()
        emits('close')
      }
      reader.readAsText(file)
    }
  },
  multiple: false,
  accept: '.json,.yaml,.yml',
})

const handleSubmit = async () => {
  if (specUrl.value) {
    await importSpecFromUrl(specUrl.value)
    emits('close')
  }
}

const importInput = ref<HTMLInputElement | null>(null)
onMounted(() => {
  importInput.value?.focus()
  window.addEventListener(
    'keydown',
    (event) => handleKeyDown(event, handleSubmit),
    true,
  )
})

onBeforeUnmount(() => {
  window.removeEventListener(
    'keydown',
    (event) => handleKeyDown(event, handleSubmit),
    true,
  )
})
</script>
<template>
  <div class="flex w-full flex-col gap-3">
    <div
      class="gap-3 rounded bg-b-2 focus-within:bg-b-1 focus-within:shadow-border min-h-20 relative">
      <label
        class="absolute w-full h-full opacity-0 cursor-text"
        for="requestimport"></label>
      <input
        id="requestimport"
        ref="importInput"
        class="border-transparent outline-none w-full pl-8 text-sm min-h-8 py-1.5"
        label="Paste Swagger File URL"
        placeholder="Paste Swagger File URL" />
    </div>
    <div class="flex gap-2">
      <div class="flex flex-1 gap-2 max-h-8">
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
      </div>
      <ScalarButton
        class="max-h-8 text-xs p-0 px-3"
        @click="handleSubmit">
        Import Collection
      </ScalarButton>
    </div>
  </div>
</template>
