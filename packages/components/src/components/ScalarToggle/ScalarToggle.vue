<script setup lang="ts">
import { cva, cx } from '@scalar/use-hooks/useBindCx'

const props = defineProps<{
  modelValue?: boolean
  disabled?: boolean
  label?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

function toggle() {
  if (props.disabled) {
    return
  }
  emit('update:modelValue', !props.modelValue)
}

const variants = cva({
  base: 'relative h-3.5 w-6 cursor-pointer rounded-full bg-b-3 transition-colors duration-300',
  variants: {
    checked: { true: 'bg-c-accent' },
    disabled: { true: 'cursor-not-allowed opacity-40' },
  },
})
</script>
<template>
  <button
    :aria-checked="modelValue"
    :aria-disabled="disabled"
    :class="cx(variants({ checked: modelValue, disabled }))"
    role="switch"
    type="button"
    @click="toggle">
    <div
      class="absolute left-px top-px flex h-3 w-3 items-center justify-center rounded-full bg-white text-c-accent transition-transform duration-300"
      :class="{ 'translate-x-2.5': modelValue }" />
    <span
      v-if="label"
      class="sr-only">
      {{ label }}
    </span>
  </button>
</template>
