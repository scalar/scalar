<script lang="ts">
/**
 * Command Action Input Component
 *
 * A textarea input component for command palette actions.
 * Supports v-model binding, auto-focus, and special keyboard handling:
 * - Enter submits the parent form (unless Shift is held)
 * - Backspace emits delete event when input is empty (for navigation back)
 *
 * @example
 * <CommandActionInput
 *   v-model="inputValue"
 *   placeholder="Enter name..."
 *   :autofocus="true"
 *   @delete="handleBack"
 * />
 */
export default {
  name: 'CommandActionInput',
}
</script>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'

const {
  modelValue,
  placeholder,
  autofocus = true,
} = defineProps<{
  /** Current value of the input */
  modelValue?: string
  /** Placeholder text shown when input is empty */
  placeholder?: string
  /** Whether to automatically focus the input when mounted */
  autofocus?: boolean
}>()

const emit = defineEmits<{
  /** Emitted when the input value changes (v-model support) */
  (event: 'update:modelValue', value: string): void
  /** Emitted when backspace is pressed on empty input for navigation back */
  (event: 'delete', keyboardEvent: KeyboardEvent): void
}>()

defineOptions({ inheritAttrs: false })

const input = ref<HTMLTextAreaElement | null>(null)

/**
 * Two-way binding computed property for v-model support.
 * Ensures we always have a string value even if modelValue is undefined.
 */
const model = computed<string>({
  get: () => modelValue ?? '',
  set: (value) => emit('update:modelValue', value),
})

/**
 * Auto-focus the input after mounting if autofocus prop is true.
 * Uses nextTick to ensure the DOM is ready before focusing.
 */
onMounted(() => {
  nextTick(() => {
    if (autofocus) {
      input.value?.focus()
    }
  })
})

/**
 * Handles Enter key to submit the parent form.
 * Shift+Enter is ignored to allow multi-line input if needed.
 */
const handleEnter = (event: KeyboardEvent): void => {
  if (event.shiftKey || !event.target) {
    return
  }

  event.preventDefault()

  const target = event.target as HTMLTextAreaElement
  const submitEvent = new Event('submit', { cancelable: true })
  target.form?.dispatchEvent(submitEvent)
}

/**
 * Handles Backspace key when input is empty.
 * Emits delete event to allow parent to navigate back or undo the last action.
 */
const handleDelete = (event: KeyboardEvent): void => {
  if (model.value !== '') {
    return
  }

  event.preventDefault()
  event.stopPropagation()
  emit('delete', event)
}
</script>

<template>
  <textarea
    id="command-action-input"
    ref="input"
    v-model="model"
    class="min-h-8 w-full flex-1 resize-none border border-transparent py-1.5 pl-8.5 text-sm outline-none focus:border-b-1"
    :placeholder="placeholder ?? ''"
    wrap="hard"
    v-bind="$attrs"
    @keydown.delete="handleDelete"
    @keydown.enter="handleEnter" />
</template>
