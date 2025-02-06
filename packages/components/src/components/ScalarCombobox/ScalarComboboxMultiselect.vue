<script setup lang="ts">
import { ref } from 'vue'

import type { ScalarFloatingOptions } from '../ScalarFloating'
import ComboboxOptions from './ScalarComboboxOptions.vue'
import ComboboxPopover from './ScalarComboboxPopover.vue'
import type { ComboboxSlots, Option, OptionGroup } from './types'

defineProps<
  {
    options: Option[] | OptionGroup[]
    modelValue?: Option[]
    placeholder?: string
    isDeletable?: boolean
  } & ScalarFloatingOptions
>()

defineEmits<{
  (e: 'update:modelValue', v: Option[]): void
  (e: 'delete', option: Option): void
}>()

defineSlots<ComboboxSlots>()

/** Propagate up the popover ref */
const comboboxPopoverRef = ref<typeof ComboboxPopover | null>(null)

defineExpose({ comboboxPopoverRef })
</script>
<template>
  <ComboboxPopover
    ref="comboboxPopoverRef"
    :middleware="middleware"
    :offset="offset"
    :placement="placement ?? 'bottom-start'"
    :resize="resize"
    :target="target"
    :teleport="teleport">
    <slot />
    <template #popover="{ open }">
      <ComboboxOptions
        v-if="options?.length"
        :isDeletable="isDeletable"
        :modelValue="modelValue"
        multiselect
        :open="open"
        :options="options"
        :placeholder="placeholder"
        @delete="(option: Option) => $emit('delete', option)"
        @update:modelValue="(v) => $emit('update:modelValue', v)">
        <template
          v-if="$slots.before"
          #before>
          <slot
            name="before"
            :open="open" />
        </template>
        <template
          v-if="$slots.after"
          #after>
          <slot
            name="after"
            :open="open" />
        </template>
      </ComboboxOptions>
    </template>
  </ComboboxPopover>
</template>
