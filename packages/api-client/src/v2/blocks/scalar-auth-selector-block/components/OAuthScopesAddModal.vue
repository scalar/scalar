<script setup lang="ts">
import { ScalarModal, type ModalState } from '@scalar/components'
import { useToasts } from '@scalar/use-toasts'
import { computed, ref, watch } from 'vue'

import {
  CommandActionForm,
  CommandActionInput,
} from '@/v2/features/command-palette'

const {
  state,
  scopes,
  scope = null,
} = defineProps<{
  state: ModalState
  /** Existing scope names on the flow, used to prevent duplicates */
  scopes: string[]
  /**
   * When provided, the modal switches to "edit" mode and is prefilled with this scope.
   * The original name is retained so the consumer can rename it.
   */
  scope?: { name: string; description: string } | null
}>()

const emit = defineEmits<{
  (event: 'cancel'): void
  (
    event: 'submit',
    scopeData: {
      name: string
      description: string
      /** The original name on the flow, only set when editing an existing scope */
      oldName?: string
    },
  ): void
}>()

const isEditMode = computed(() => scope !== null)
const title = computed(() => (isEditMode.value ? 'Edit Scope' : 'Add Scope'))
const submitLabel = computed(() => (isEditMode.value ? 'Save' : 'Add Scope'))

const scopeData = ref({
  name: '',
  description: '',
})

const { toast } = useToasts()

/**
 * Whether the chosen name collides with an existing scope on the flow.
 * In edit mode we allow keeping the original name unchanged.
 */
const isDuplicateName = computed(() => {
  const name = scopeData.value.name
  if (!name) {
    return false
  }
  if (isEditMode.value && name === scope?.name) {
    return false
  }
  return scopes.includes(name)
})

const handleSubmit = () => {
  if (!scopeData.value.name) {
    toast(
      isEditMode.value
        ? 'Please fill in the name before saving the scope.'
        : 'Please fill in the name before adding a scope.',
      'error',
    )
    return
  }

  emit('submit', {
    name: scopeData.value.name,
    description: scopeData.value.description,
    ...(isEditMode.value && scope ? { oldName: scope.name } : {}),
  })
  state.hide()
}

watch(
  () => state.open,
  (isOpen) => {
    if (!isOpen) {
      return
    }

    scopeData.value = scope
      ? { name: scope.name, description: scope.description }
      : { name: '', description: '' }
  },
)
</script>

<template>
  <ScalarModal
    size="xs"
    :state="state"
    :title="title">
    <CommandActionForm
      :disabled="!scopeData.name || isDuplicateName"
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
          :autofocus="false"
          class="!p-0"
          placeholder="Read user data" />
      </div>

      <template #submit>{{ submitLabel }}</template>
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
