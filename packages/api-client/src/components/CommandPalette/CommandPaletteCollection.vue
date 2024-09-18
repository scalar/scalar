<script setup lang="ts">
import { useWorkspace } from '@/store'
import { ScalarButton } from '@scalar/components'
import { useToasts } from '@scalar/use-toasts'
import { onMounted, ref } from 'vue'

const emits = defineEmits<{
  (event: 'close'): void
}>()

const { activeWorkspace, collectionMutators } = useWorkspace()
const collectionName = ref('')
const { toast } = useToasts()

const handleSubmit = () => {
  if (!collectionName.value) {
    toast('Please enter a name before creating a collection.', 'error')
    return
  }

  collectionMutators.add(
    {
      openapi: '3.1.0',
      info: {
        title: collectionName.value,
        version: '0.0.1',
      },
    },
    activeWorkspace.value.uid,
  )
  emits('close')
}

const collectionInput = ref<HTMLInputElement | null>(null)
onMounted(() => {
  collectionInput.value?.focus()
})
</script>
<template>
  <div class="flex w-full flex-col gap-3">
    <div
      class="gap-3 rounded bg-b-2 focus-within:bg-b-1 focus-within:shadow-border min-h-20 relative">
      <label
        class="absolute w-full h-full opacity-0 cursor-text"
        for="collectionanme"></label>
      <input
        id="collectionanme"
        ref="collectionInput"
        v-model="collectionName"
        autocomplete="off"
        class="border-transparent outline-none w-full pl-8 text-sm min-h-8 py-1.5"
        data-form-type="other"
        data-lpignore="true"
        label="Collection Name"
        placeholder="Collection Name"
        @keydown.prevent.enter="handleSubmit" />
    </div>
    <div class="flex">
      <div class="flex flex-1 gap-2 max-h-8"></div>
      <ScalarButton
        class="max-h-8 text-xs p-0 px-3"
        :disabled="!collectionName.trim()"
        @click="handleSubmit">
        Continue
      </ScalarButton>
    </div>
  </div>
</template>
