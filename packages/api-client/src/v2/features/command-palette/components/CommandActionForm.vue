<script lang="ts">
/**
 * Command Action Form Component
 *
 * A reusable form wrapper for command palette actions.
 * Provides a consistent layout with a main content area, optional controls,
 * and a submit button. Prevents form submission when disabled.
 *
 * @example
 * <CommandActionForm
 *   :loader
 *   :disabled="isDisabled"
 *   @submit="handleSubmit"
 *   @cancel="handleCancel"
 *   @back="handleBack"
 * >
 *   <!-- Main content goes in default slot -->
 *   <CommandActionInput v-model="value" />
 *
 *   <!-- Optional controls in options slot -->
 *   <template #options>
 *     <ScalarCheckbox v-model="option" />
 *   </template>
 *
 *   <!-- Custom submit button text -->
 *   <template #submit>Create</template>
 * </CommandActionForm>
 */
export default {
  name: 'CommandActionForm',
}
</script>

<script setup lang="ts">
import { ScalarButton, useBindCx, type LoadingState } from '@scalar/components'

const { loader, disabled = false } = defineProps<{
  /** Loading state from useLoadingState composable to show spinner on submit button */
  loader?: LoadingState
  /** Whether the form and submit button are disabled */
  disabled?: boolean
}>()

const emit = defineEmits<{
  /** Emitted when the form is submitted (if not disabled) */
  (event: 'submit'): void
  /** Emitted when the action is cancelled */
  (event: 'cancel'): void
  /** Emitted when user presses back (e.g., Escape key) */
  (event: 'back', e: KeyboardEvent): void
}>()

defineSlots<{
  /** Main content area for form inputs */
  default(): void
  /** Optional controls displayed before the submit button (e.g., checkboxes, toggles, dropdowns) */
  options(): void
  /** Custom text or content for the submit button (defaults to "Continue") */
  submit(): void
}>()

const { cx } = useBindCx()

/** Handle form submission, only emit if not disabled */
const handleSubmit = (): void => {
  if (!disabled) {
    emit('submit')
  }
}
</script>

<template>
  <form
    class="flex w-full flex-col gap-3"
    @keydown.enter.stop
    @submit.prevent.stop="handleSubmit">
    <!-- Main content area with minimum height and rounded corners -->
    <div v-bind="cx('relative flex min-h-20 flex-col rounded')">
      <slot />
    </div>

    <!-- Action bar with optional controls and submit button -->
    <div class="flex gap-2">
      <!-- Optional controls slot (e.g., checkboxes, toggles) -->
      <div class="flex max-h-8 flex-1">
        <slot name="options" />
      </div>

      <!-- Submit button with customizable text -->
      <ScalarButton
        class="max-h-8 px-3 text-xs"
        :disabled="disabled"
        :loader
        type="submit">
        <slot name="submit">Continue</slot>
      </ScalarButton>
    </div>
  </form>
</template>
