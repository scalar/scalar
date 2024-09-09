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
    isDeletable?: boolean
  } & Omit<FloatingOptions, 'middleware'>
>()

defineEmits<{
  (e: 'update:modelValue', v: Option[]): void
  (e: 'delete', option: Option): void
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
      <div class="divide-1 divide-y">
        <ComboboxOptions
          v-if="options && options.length"
          :isDeletable="isDeletable"
          :modelValue="modelValue"
          multiselect
          :open="open"
          :options="options"
          :placeholder="placeholder"
          @delete="(option: Option) => $emit('delete', option)"
          @update:modelValue="(v) => $emit('update:modelValue', v)" />
        <div
          v-if="$slots.actions"
          class="p-0.75">
          <slot name="actions" />
        </div>
      </div>
    </template>
  </ComboboxPopover>
</template>
