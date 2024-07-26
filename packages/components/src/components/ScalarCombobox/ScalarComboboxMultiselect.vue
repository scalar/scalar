<script setup lang="ts">
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/vue'

import { type FloatingOptions, ScalarFloating } from '../ScalarFloating'
import ComboboxOptions from './ScalarComboboxOptions.vue'
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

defineOptions({ inheritAttrs: false })
</script>
<template>
  <Popover
    v-slot="{ open }"
    as="template">
    <ScalarFloating
      :isOpen="open ?? isOpen"
      :placement="placement ?? 'bottom-start'"
      :resize="resize"
      :teleport="teleport">
      <PopoverButton as="template">
        <slot />
      </PopoverButton>
      <template #floating="{ width }">
        <PopoverPanel
          class="relative flex w-40 flex-col rounded border text-sm"
          focus
          :style="{ width }"
          v-bind="$attrs">
          <ComboboxOptions
            :modelValue="modelValue"
            multiselect
            :open="open"
            :options="options"
            :placeholder="placeholder"
            @update:modelValue="(v) => $emit('update:modelValue', v)" />
          <div
            class="absolute inset-0 -z-1 rounded bg-b-1 shadow-md brightness-lifted" />
        </PopoverPanel>
      </template>
    </ScalarFloating>
  </Popover>
</template>
