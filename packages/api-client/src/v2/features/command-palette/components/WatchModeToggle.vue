<script lang="ts">
/**
 * Watch Mode Toggle Component
 *
 * A toggle switch for enabling/disabling watch mode on URL imports.
 * When enabled, the API client automatically updates when the OpenAPI URL
 * content changes, ensuring the client remains up-to-date.
 *
 * Supports v-model for two-way binding and can be disabled when needed
 * (e.g., when importing from files instead of URLs).
 *
 * @example
 * <WatchModeToggle
 *   v-model="watchMode"
 *   :disabled="!isUrlImport"
 * />
 */
export default {}
</script>

<script setup lang="ts">
import { ScalarIcon, ScalarToggle } from '@scalar/components'
import { computed } from 'vue'

const { modelValue, disabled = false } = defineProps<{
  /** Whether watch mode is currently enabled */
  modelValue: boolean
  /** Whether the toggle is disabled (e.g., for non-URL imports) */
  disabled?: boolean
}>()

const emit = defineEmits<{
  /** Emitted when the toggle state changes (v-model support) */
  (event: 'update:modelValue', value: boolean): void
}>()

/** Two-way binding computed property for v-model support */
const model = computed<boolean>({
  get: () => modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
})
</script>

<template>
  <label
    class="text-c-2 flex items-center gap-2 rounded p-3 py-1.5 text-sm select-none"
    :class="disabled ? 'cursor-default' : 'cursor-pointer'"
    for="watch-toggle">
    <!-- Watch mode label with icon -->
    <span
      class="text-c-1 flex items-center gap-1 text-xs font-medium"
      :class="{ 'text-c-3': !modelValue }">
      <ScalarIcon
        icon="Watch"
        size="sm" />
      Watch Mode
    </span>

    <!-- Toggle switch -->
    <ScalarToggle
      id="watch-toggle"
      v-model="model"
      :disabled="disabled" />
  </label>
</template>
