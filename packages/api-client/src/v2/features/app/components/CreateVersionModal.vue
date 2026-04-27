<script setup lang="ts">
import { ScalarModal, type ModalState } from '@scalar/components'
import { computed, ref, watch, type ComputedRef, type Ref } from 'vue'

import {
  CommandActionForm,
  CommandActionInput,
} from '@/v2/features/command-palette'

const { state, existingVersions } = defineProps<{
  /** Modal lifecycle state from `useModal()`. */
  state: ModalState
  /**
   * Versions already loaded into the workspace store for the active document
   * group. Submitting a duplicate would silently collide with an existing
   * workspace document, so we reject it up front. Versions that exist only on
   * the registry (not loaded locally) are intentionally allowed - that is the
   * conflict-resolution path the create-draft flow opts into.
   */
  existingVersions: string[]
}>()

const emit = defineEmits<{
  /** Fired after the user submits a non-empty, non-duplicate version string. */
  (event: 'create', version: string): void
}>()

/** Raw input value for the version field. */
const version: Ref<string> = ref('')

/** Trimmed input. The form treats whitespace-only input as empty. */
const trimmed: ComputedRef<string> = computed(() => version.value.trim())

/**
 * Validation message surfaced under the input.
 *
 * Resolves to `null` when the form is valid; otherwise to a human-readable
 * reason that doubles as the disabled-state explanation.
 */
const errorMessage: ComputedRef<string | null> = computed(() => {
  if (trimmed.value.length === 0) {
    // Empty input is the default state, so we keep the field free of error
    // styling and only block submission via `isDisabled` below.
    return null
  }
  if (existingVersions.includes(trimmed.value)) {
    return `Version "${trimmed.value}" is already loaded in the workspace.`
  }
  return null
})

/** Submit is blocked while the input is empty or the version already exists locally. */
const isDisabled: ComputedRef<boolean> = computed(
  () => trimmed.value.length === 0 || errorMessage.value !== null,
)

/** Reset the field whenever the modal opens so stale input never leaks across sessions. */
watch(
  () => state.open,
  (isOpen) => {
    if (isOpen) {
      version.value = ''
    }
  },
)

const handleSubmit = (): void => {
  if (isDisabled.value) {
    return
  }
  emit('create', trimmed.value)
  state.hide()
}
</script>

<template>
  <ScalarModal
    bodyClass="border-t-0 rounded-t-lg"
    size="xs"
    :state="state"
    title="Create new version">
    <CommandActionForm
      :disabled="isDisabled"
      @submit="handleSubmit">
      <CommandActionInput
        v-model="version"
        class="-mt-[.5px] !p-0"
        placeholder="Version (e.g. 2.1.0)" />

      <p
        v-if="errorMessage"
        class="text-red text-xs"
        role="alert">
        {{ errorMessage }}
      </p>

      <template #submit>Create version</template>
    </CommandActionForm>
  </ScalarModal>
</template>
