<script setup lang="ts">
import { useWorkspace } from '@/store'
import { useToasts } from '@scalar/use-toasts'
import { ref } from 'vue'

import CommandActionForm from './CommandActionForm.vue'
import CommandActionInput from './CommandActionInput.vue'

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
</script>
<template>
  <CommandActionForm
    :disabled="!collectionName.trim()"
    @submit="handleSubmit">
    <CommandActionInput
      v-model="collectionName"
      label="Collection Name"
      placeholder="Collection Name" />
    <template #submit>Create Collection</template>
  </CommandActionForm>
</template>
