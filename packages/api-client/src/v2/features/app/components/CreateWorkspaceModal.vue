<script setup lang="ts">
import { ScalarModal, type ModalState } from '@scalar/components'
import { computed, ref, watch, type ComputedRef, type Ref } from 'vue'

import CommandActionForm from '@/components/CommandPalette/CommandActionForm.vue'
import CommandActionInput from '@/components/CommandPalette/CommandActionInput.vue'

const { state } = defineProps<{
  state: ModalState
}>()

const emit = defineEmits<{
  (e: 'create:workspace', payload: { name: string }): void
}>()

/** Name input for the new workspace. Resets whenever the modal opens. */
const name: Ref<string> = ref('')

/** Trimmed version of the name to avoid repeating .trim() in multiple places. */
const trimmedName: ComputedRef<string> = computed(() => name.value.trim())

/** Disable submit when the name is empty after trimming. */
const isDisabled: ComputedRef<boolean> = computed(
  () => trimmedName.value.length === 0,
)

/**
 * Ensure the form is reset whenever the modal opens.
 * Avoids stale state if the modal is reopened.
 */
watch(
  () => state.open,
  (isOpen) => {
    if (isOpen) {
      name.value = ''
    }
  },
)

/** Emits an event to create the workspace with the provided name */
const handleSubmit = (): void => {
  if (!trimmedName.value) {
    return
  }

  emit('create:workspace', {
    name: trimmedName.value,
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
      :disabled="isDisabled"
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
