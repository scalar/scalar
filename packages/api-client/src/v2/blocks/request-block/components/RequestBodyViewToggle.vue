<script lang="ts" setup>
import { useLocalization } from '@/v2/features/localization'

const { showForm = true, showSchema = false } = defineProps<{
  modelValue: 'form' | 'raw' | 'schema'
  /** Offer the structured form editor when the body supports it. */
  showForm?: boolean
  /** Offer read-only schema inspection when a schema exists. */
  showSchema?: boolean
  /** Non-text editors use Body instead of Raw. */
  rawLabel?: string
  /** Disable switching to the form view (e.g. while the raw body is not parseable) */
  disabled?: boolean
}>()

defineEmits<{
  (e: 'update:modelValue', v: 'form' | 'raw' | 'schema'): void
}>()

const { translate } = useLocalization()
</script>
<template>
  <div
    class="text-c-3 text-xxs -my-1 mr-2 flex justify-center gap-0.5 rounded p-0.5">
    <button
      v-if="showForm"
      :aria-pressed="modelValue === 'form'"
      class="rounded px-1"
      :class="
        disabled
          ? 'cursor-not-allowed opacity-50'
          : {
              'bg-b-3 text-c-1 cursor-default': modelValue === 'form',
              'hover:bg-b-3': modelValue !== 'form',
            }
      "
      :disabled="disabled"
      :title="
        disabled
          ? translate('apiClient.requestBodyViewToggle.fixBody')
          : undefined
      "
      type="button"
      @click.stop="$emit('update:modelValue', 'form')">
      {{ translate('apiClient.requestBodyViewToggle.form') }}
    </button>
    <button
      :aria-pressed="modelValue === 'raw'"
      class="hover:bg-b-3 rounded px-1"
      :class="{ 'bg-b-3 text-c-1 cursor-default': modelValue === 'raw' }"
      type="button"
      @click.stop="$emit('update:modelValue', 'raw')">
      {{ rawLabel ?? translate('apiClient.requestBodyViewToggle.raw') }}
    </button>
    <button
      v-if="showSchema"
      :aria-pressed="modelValue === 'schema'"
      class="hover:bg-b-3 rounded px-1"
      :class="{ 'bg-b-3 text-c-1 cursor-default': modelValue === 'schema' }"
      type="button"
      @click.stop="$emit('update:modelValue', 'schema')">
      {{ translate('apiClient.requestBodyViewToggle.schema') }}
    </button>
  </div>
</template>
