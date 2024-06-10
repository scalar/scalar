<script setup lang="ts">
import Collection from '@/assets/ascii/collection.ascii?raw'
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
const collectionName = ref('')

const handleSubmit = () => {
  collectionMutators.add({
    spec: {
      openapi: '3.1.0',
      info: {
        title: collectionName.value,
        version: '0.0.1',
      },
    },
  })
  emits('close')
}
</script>
<template>
  <ScalarAsciiArt
    :art="Collection"
    class="mt-[3px]" />
  <h2>{{ title }}</h2>
  <form
    class="flex w-full flex-col gap-3"
    @submit.prevent="handleSubmit">
    <input
      v-model="collectionName"
      class="h-10 rounded border p-2"
      label="Collection Name"
      placeholder="Collection Name" />
    <ScalarButton type="submit">Continue</ScalarButton>
  </form>
</template>
