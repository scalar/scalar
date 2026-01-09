<script setup lang="ts">
import { ScalarModal, type ModalState } from '@scalar/components'
import { useToasts } from '@scalar/use-toasts'
import { ref, watch } from 'vue'

import CommandActionForm from '@/components/CommandPalette/CommandActionForm.vue'
import CommandActionInput from '@/components/CommandPalette/CommandActionInput.vue'

const props = defineProps<{
  state: ModalState
}>()

const emit = defineEmits<{
  (event: 'cancel'): void
  (
    event: 'submit',
    scopeData: {
      name: string
      description: string
    },
  ): void
}>()

const scopeData = ref({
  name: '',
  description: '',
})

const { toast } = useToasts()

const handleSubmit = () => {
  if (!scopeData.value.name) {
    toast('Please fill in the name before adding a scope.', 'error')
    return
  }

  emit('submit', scopeData.value)
  props.state.hide()
}

// Reset scope data
watch(
  () => props.state.open,
  (isOpen) => {
    if (isOpen) {
      scopeData.value = {
        name: '',
        description: '',
      }
    }
  },
)
</script>

<template>
  <ScalarModal
    size="xs"
    :state="state"
    title="Add Scope">
    <CommandActionForm
      :disabled="!scopeData.name"
      @cancel="emit('cancel')"
      @submit="handleSubmit">
      <!-- Name -->
      <div class="flex h-8 items-start gap-2 text-sm">
        Name:
        <CommandActionInput
          v-model="scopeData.name"
          autofocus
          class="!p-0"
          placeholder="read:user" />
      </div>

      <!-- Description -->
      <div class="flex h-8 items-start gap-2 text-sm">
        Description:
        <CommandActionInput
          v-model="scopeData.description"
          class="!p-0"
          placeholder="Read user data" />
      </div>

      <template #submit>Add Scope</template>
    </CommandActionForm>
  </ScalarModal>
</template>

<style scoped>
.form-group {
  margin-bottom: 1rem;
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}
</style>
