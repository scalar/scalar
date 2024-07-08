<script setup lang="ts">
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
  <h2>{{ title }}</h2>
  <form
    class="flex w-full flex-col gap-3"
    @submit.prevent="handleSubmit">
    <div
      class="gap-3 rounded bg-b-2 focus-within:bg-b-1 focus-within:shadow-border min-h-20 relative">
      <label
        class="absolute w-full h-full opacity-0 cursor-text"
        for="collectionanme"></label>
      <input
        id="collectionanme"
        v-model="collectionName"
        class="border-transparent outline-none w-full pl-8 text-sm min-h-8 py-1.5"
        label="Collection Name"
        placeholder="Collection Name" />
    </div>
    <div class="flex">
      <div class="flex flex-1 gap-2 max-h-8"></div>
      <ScalarButton
        class="max-h-8 text-xs p-0 px-3"
        type="submit"
        >Continue</ScalarButton
      >
    </div>
  </form>
</template>
