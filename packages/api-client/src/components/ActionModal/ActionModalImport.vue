<script setup lang="ts">
import Import from '@/assets/ascii/import.ascii?raw'
import ScalarAsciiArt from '@/components/ScalarAsciiArt.vue'
import { useFileDialog } from '@/hooks'
import { useWorkspace } from '@/store/workspace'
import { ScalarButton, ScalarIcon } from '@scalar/components'
import { ref } from 'vue'

defineProps<{
  title: string
}>()

const emits = defineEmits<{
  (event: 'close'): void
}>()

const { importSpecFile, importSpecFromUrl } = useWorkspace()
const specUrl = ref('')

const { open: openSpecFileDialog } = useFileDialog({
  onChange: async (files) => {
    const file = files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = async (e) => {
        const text = e.target?.result as string
        importSpecFile(text)
        handleSubmit()
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
</script>
<template>
  <ScalarAsciiArt :art="Import" />
  <h2>{{ title }}</h2>
  <form
    class="flex w-full flex-col gap-3"
    @submit.prevent="handleSubmit">
    <ScalarButton
      class="relative"
      variant="outlined"
      @click="openSpecFileDialog">
      JSON, or YAML Files
      <ScalarIcon
        class="text-c-3 absolute right-3 -rotate-90"
        icon="ArrowRight"
        size="sm" />
    </ScalarButton>
    <input
      class="h-10 rounded border p-2"
      label="Paste Swagger File URL"
      placeholder="Paste Swagger File URL" />
    <ScalarButton type="submit"> Continue </ScalarButton>
  </form>
</template>
