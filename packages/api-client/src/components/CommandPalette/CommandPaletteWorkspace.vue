<script setup lang="ts">
import { useToasts } from '@scalar/use-toasts'
import { ref } from 'vue'
import { useRouter } from 'vue-router'

import { useWorkspace } from '@/store'

import CommandActionForm from './CommandActionForm.vue'
import CommandActionInput from './CommandActionInput.vue'

const emits = defineEmits<{
  (event: 'close'): void
  (event: 'back', e: KeyboardEvent): void
}>()

const { push } = useRouter()
const { toast } = useToasts()
const { workspaceMutators } = useWorkspace()
const workspaceName = ref('')

const handleSubmit = () => {
  if (!workspaceName.value.trim()) {
    toast('Please enter a name before creating a workspace.', 'error')
    return
  }

  const workspace = workspaceMutators.add({
    name: workspaceName.value,
  })

  push({
    name: 'workspace',
    params: {
      workspace: workspace.uid,
    },
  })

  emits('close')
}
</script>
<template>
  <CommandActionForm
    :disabled="!workspaceName.trim()"
    @submit="handleSubmit">
    <CommandActionInput
      v-model="workspaceName"
      label="Workspace Name"
      placeholder="Workspace Name"
      @onDelete="emits('back', $event)" />
    <template #submit>Create Workspace</template>
  </CommandActionForm>
</template>
