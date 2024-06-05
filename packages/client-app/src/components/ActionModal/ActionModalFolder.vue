<script setup lang="ts">
import Folder from '@/assets/ascii/folder.ascii?raw'
import ScalarAsciiArt from '@/components/ScalarAsciiArt.vue'
import { useWorkspace } from '@/store/workspace'
import { ScalarButton } from '@scalar/components'
import { ref } from 'vue'

defineProps<{
  title: string
}>()

const emits = defineEmits<{
  (event: 'close'): void
}>()

const { collectionMutators } = useWorkspace()
const folderName = ref('')

function handleSubmit() {
  if (folderName.value) {
    /** TODO: set parent collection */
    collectionMutators.addFolder(0, null, { name: folderName.value })
    emits('close')
  }
}
</script>
<template>
  <ScalarAsciiArt :art="Folder" />
  <h2>{{ title }}</h2>
  <form
    class="flex w-full flex-col gap-3"
    @submit.prevent="handleSubmit">
    <input
      v-model="folderName"
      class="h-10 rounded border p-2"
      label="Folder Name"
      placeholder="Folder Name" />
    <ScalarButton type="submit"> Create Folder </ScalarButton>
  </form>
</template>
