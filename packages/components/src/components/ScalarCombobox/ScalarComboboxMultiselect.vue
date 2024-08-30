<script setup lang="ts">
import { ref } from 'vue'

import type { FloatingOptions } from '../ScalarFloating'
import ComboboxOptions from './ScalarComboboxOptions.vue'
import ComboboxPopover from './ScalarComboboxPopover.vue'
import type { Option, OptionGroup } from './types'

defineProps<
  {
    options: Option[] | OptionGroup[]
    modelValue?: Option[]
    placeholder?: string
  } & Omit<FloatingOptions, 'middleware'>
>()

defineEmits<{
  (e: 'update:modelValue', v: Option[]): void
}>()

/** Propagate up the popover ref */
const comboboxPopoverRef = ref<typeof ComboboxPopover | null>(null)

defineExpose({ comboboxPopoverRef })
</script>
<template>
  <ComboboxPopover
    ref="comboboxPopoverRef"
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
