<script setup lang="ts">
import type { FloatingOptions } from '../ScalarFloating'
import ComboboxOptions from './ScalarComboboxOptions.vue'
import ComboboxPopover from './ScalarComboboxPopover.vue'
import type { Option, OptionGroup } from './types'

defineProps<
  {
    options: Option[] | OptionGroup[]
    modelValue?: Option
    placeholder?: string
  } & Omit<FloatingOptions, 'middleware'>
>()

defineEmits<{
  (e: 'update:modelValue', v: Option): void
}>()
</script>
<template>
  <ComboboxPopover
    :isOpen="isOpen"
    :placement="placement ?? 'bottom-start'"
    :resize="resize"
    :targetRef="targetRef"
    :teleport="teleport">
    <slot />
    <template #popover="{ open, close }">
      <ComboboxOptions
        :modelValue="modelValue ? [modelValue] : []"
        :open="open"
        :options="options"
        :placeholder="placeholder"
        @update:modelValue="(v) => (close(), $emit('update:modelValue', v[0]))">
        <template
          v-if="$slots.before"
          #before>
          <slot name="before" />
        </template>
        <template
          v-if="$slots.after"
          #after>
          <slot name="after" />
        </template>
      </ComboboxOptions>
    </template>
  </ComboboxPopover>
</template>
