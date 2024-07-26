<script setup lang="ts">
import type { FloatingOptions } from '../ScalarFloating'
import ComboboxOptions from './ScalarComboboxOptions.vue'
import ComboboxPopover from './ScalarComboboxPopover.vue'
import type { Option } from './types'

defineProps<
  {
    options: Option[]
    modelValue?: Option[]
    placeholder?: string
  } & Omit<FloatingOptions, 'middleware'>
>()

defineEmits<{
  (e: 'update:modelValue', v: Option[]): void
}>()
</script>
<template>
  <ComboboxPopover
    :isOpen="isOpen"
    :placement="placement ?? 'bottom-start'"
    :resize="resize"
    :teleport="teleport">
    <slot />
    <template #popover="{ open }">
      <ComboboxOptions
        :modelValue="modelValue"
        multiselect
        :open="open"
        :options="options"
        :placeholder="placeholder"
        @update:modelValue="(v) => $emit('update:modelValue', v)" />
    </template>
  </ComboboxPopover>
</template>
