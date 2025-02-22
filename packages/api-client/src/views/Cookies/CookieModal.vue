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
    cookieData: {
      name: string
      value: string
      domain: string
    },
  ): void
}>()

const cookieData = ref({
  name: '',
  value: '',
  domain: '',
})

const { toast } = useToasts()

const handleSubmit = () => {
  if (!cookieData.value.name || !cookieData.value.value) {
    toast('Please fill in all fields before adding a cookie.', 'error')
    return
  }

  emit('submit', cookieData.value)
  props.state.hide()
}

// Reset cookie data
watch(
  () => props.state.open,
  (isOpen) => {
    if (isOpen) {
      cookieData.value = {
        name: '',
        value: '',
        domain: '',
      }
    }
  },
)
</script>

<template>
  <ScalarModal
    size="xs"
    :state="state"
    title="Add Cookie">
    <CommandActionForm
      :disabled="!cookieData.name || !cookieData.value"
      @cancel="emit('cancel')"
      @submit="handleSubmit">
      <div class="flex h-8 items-start gap-2 text-sm">
        Name:
        <CommandActionInput
          v-model="cookieData.name"
          autofocus
          class="!p-0"
          placeholder="session_id" />
      </div>
      <div class="flex h-8 items-start gap-2 text-sm">
        Value:
        <CommandActionInput
          v-model="cookieData.value"
          autofocus
          class="!p-0"
          placeholder="my-cookie-session-id" />
      </div>
      <div class="flex h-8 items-start gap-2 text-sm">
        Domain:
        <CommandActionInput
          v-model="cookieData.domain"
          autofocus
          class="!p-0"
          placeholder="example.com" />
      </div>
      <template #submit>Add Cookie</template>
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
