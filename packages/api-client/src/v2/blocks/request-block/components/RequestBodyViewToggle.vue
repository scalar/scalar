<script lang="ts" setup>
defineProps<{
  modelValue: 'form' | 'raw'
  /** Disable switching to the form view (e.g. while the raw body is not parseable) */
  disabled?: boolean
}>()
defineEmits<{
  (e: 'update:modelValue', v: 'form' | 'raw'): void
}>()
</script>
<template>
  <div
    class="text-c-3 text-xxs -my-1 mr-2 flex justify-center gap-0.5 rounded p-0.5">
    <button
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
      :title="disabled ? 'Fix the body to switch to the form view' : undefined"
      type="button"
      @click.stop="$emit('update:modelValue', 'form')">
      Form
    </button>
    <button
      class="hover:bg-b-3 rounded px-1"
      :class="{ 'bg-b-3 text-c-1 cursor-default': modelValue === 'raw' }"
      type="button"
      @click.stop="$emit('update:modelValue', 'raw')">
      Raw
    </button>
  </div>
</template>
