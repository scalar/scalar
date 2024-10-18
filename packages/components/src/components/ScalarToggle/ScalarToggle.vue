<script setup lang="ts">
import { cva, cx } from '../../cva'

const props = defineProps<{
  modelValue: boolean
  disabled?: boolean
  id?: string
  ariaLabel?: string
  ariaLabelledBy?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

function toggle() {
  if (!props.disabled) {
    emit('update:modelValue', !props.modelValue)
  }
}

const toggleClasses = cva({
  base: 'relative h-3.5 w-6 cursor-pointer rounded-full bg-b-3 transition-colors duration-300',
  variants: {
    checked: { true: 'bg-c-accent' },
    disabled: { true: 'cursor-not-allowed opacity-40' },
  },
})
</script>
<template>
  <div
    :class="cx(toggleClasses({ checked: modelValue, disabled }))"
    role="switch"
    tabindex="0"
    @keydown.enter.prevent="toggle"
    @keydown.space.prevent="toggle">
    <input
      :id="props.id"
      :aria-checked="modelValue"
      :aria-disabled="disabled"
      :aria-label="props.ariaLabel"
      :aria-labelledby="props.ariaLabelledBy"
      :checked="modelValue"
      class="hidden"
      :disabled="disabled"
      type="checkbox"
      @change="toggle" />
    <div
      class="absolute left-px top-px flex h-3 w-3 items-center justify-center rounded-full bg-white text-c-accent transition-transform duration-300"
      :class="{ 'translate-x-2.5': modelValue }"></div>
  </div>
</template>
