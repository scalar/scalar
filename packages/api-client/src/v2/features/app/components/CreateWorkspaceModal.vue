<script setup lang="ts">
import { ScalarModal, type ModalState } from '@scalar/components'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import { ref } from 'vue'

import CommandActionForm from '@/components/CommandPalette/CommandActionForm.vue'
import CommandActionInput from '@/components/CommandPalette/CommandActionInput.vue'

const { state, eventBus } = defineProps<{
  state: ModalState
  eventBus: WorkspaceEventBus
}>()

const name = ref('')

/** Emits an event to create the workspace with the provided name */
const handleSubmit = (): void => {
  eventBus.emit('workspace:create:workspace', {
    workspaceName: name.value.trim(),
  })
  state.hide()
}
</script>

<template>
  <ScalarModal
    bodyClass="border-t-0 rounded-t-lg"
    size="xs"
    :state="state">
    <CommandActionForm
      :disabled="!name.trim()"
      @submit="handleSubmit">
      <CommandActionInput
        v-model="name"
        class="-mt-[.5px] !p-0"
        placeholder="Workspace name" />

      <!-- Submit button -->
      <template #submit>Add Workspace</template>
    </CommandActionForm>
  </ScalarModal>
</template>
