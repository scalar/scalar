<script setup lang="ts">
import { useWorkspace } from '@/store'
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import CommandActionForm from './CommandActionForm.vue'
import CommandActionInput from './CommandActionInput.vue'

const emits = defineEmits<{
  (event: 'close'): void
}>()

const { push } = useRouter()
const { workspaceMutators } = useWorkspace()
const workspaceName = ref('')

const handleSubmit = () => {
  const workspace = workspaceMutators.add({
    name: workspaceName.value,
  })
  push(`/workspace/${workspace.uid}`)
  emits('close')
}

const workspaceInput = ref<HTMLInputElement | null>(null)
onMounted(() => {
  workspaceInput.value?.focus()
})
</script>
<template>
  <CommandActionForm
    :disabled="!workspaceName.trim()"
    @submit="handleSubmit">
    <CommandActionInput
      v-model="workspaceName"
      label="Workspace Name"
      placeholder="Workspace Name" />
    <template #submit>Create Workspace</template>
  </CommandActionForm>
</template>
