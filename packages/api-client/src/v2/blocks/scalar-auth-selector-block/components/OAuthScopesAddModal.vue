<script setup lang="ts">
import { ScalarModal, type ModalState } from '@scalar/components'
import { computed, nextTick, ref, watch } from 'vue'

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

/**
 * Tracks whether the user has interacted with the name field so we can defer the
 * "name is required" hint until after the first edit, rather than on initial render.
 */
const hasTouchedName = ref(false)

watch(
  () => scopeData.value.name,
  () => {
    hasTouchedName.value = true
  },
)

const trimmedName = computed(() => scopeData.value.name.trim())

/**
 * Whether the chosen name collides with an existing scope on the flow.
 * In edit mode we allow keeping the original name unchanged.
 */
const isDuplicateName = computed(() => {
  if (!trimmedName.value) {
    return false
  }
  if (isEditMode.value && trimmedName.value === scope?.name) {
    return false
  }
  return scopes.includes(trimmedName.value)
})

/** Human readable validation message rendered inline in the modal */
const validationError = computed<string | null>(() => {
  if (isDuplicateName.value) {
    return `A scope named "${trimmedName.value}" already exists.`
  }
  if (hasTouchedName.value && !trimmedName.value) {
    return 'Scope name is required.'
  }
  return null
})

const isSubmitDisabled = computed(
  () => !trimmedName.value || isDuplicateName.value,
)

const handleSubmit = () => {
  if (isSubmitDisabled.value) {
    return
  }

  emit('submit', {
    name: trimmedName.value,
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
    // Clearing `name` schedules the `scopeData.name` watcher, which sets
    // `hasTouchedName` back to true in the same flush. Defer the reset so it
    // runs after that watcher and reopening add mode does not show a false
    // "Scope name is required" error.
    void nextTick(() => {
      hasTouchedName.value = false
    })
  },
)
</script>

<template>
  <ScalarModal
    bodyClass="overflow-y-auto"
    size="xs"
    :state="state"
    :title="title">
    <CommandActionForm
      :disabled="isSubmitDisabled"
      @cancel="emit('cancel')"
      @submit="handleSubmit">
      <!-- Name -->
      <div class="flex min-h-8 items-start gap-2 text-sm">
        Name:
        <CommandActionInput
          v-model="scopeData.name"
          autofocus
          class="field-sizing-content !p-0"
          placeholder="read:user" />
      </div>

      <!-- Description -->
      <div class="flex min-h-8 items-start gap-2 text-sm">
        Description:
        <CommandActionInput
          v-model="scopeData.description"
          :autofocus="false"
          class="field-sizing-content !p-0"
          placeholder="Read user data" />
      </div>

      <!-- Inline validation error -->
      <div
        v-if="validationError"
        class="text-red text-xs"
        role="alert">
        {{ validationError }}
      </div>

      <template #submit>{{ submitLabel }}</template>
    </CommandActionForm>
  </ScalarModal>
</template>
