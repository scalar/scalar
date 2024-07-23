<script setup lang="ts">
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/vue'

import { type FloatingOptions, ScalarFloating } from '../ScalarFloating'
import ComboboxOptions from './ScalarComboboxOptions.vue'
import type { Option } from './types'

defineProps<
  {
    options: Option[]
    modelValue?: Option
    placeholder?: string
  } & FloatingOptions
>()

defineEmits<{
  (e: 'update:modelValue', v: Option): void
}>()

defineOptions({ inheritAttrs: false })
</script>
<template>
  <Popover v-slot="{ open }">
    <ScalarFloating
      :isOpen="open ?? isOpen"
      :middleware="middleware"
      :placement="placement ?? 'bottom-start'"
      :resize="resize"
      :teleport="teleport">
      <PopoverButton as="template">
        <slot />
      </PopoverButton>
      <template #floating="{ width }">
        <PopoverPanel
          v-slot="{ close }"
          class="relative flex w-40 flex-col rounded border text-xs"
          focus
          :style="{ width }"
          v-bind="$attrs">
          <ComboboxOptions
            :modelValue="modelValue"
            :open="open"
            :options="options"
            :placeholder="placeholder"
            @update:modelValue="
              (v) => (close(), $emit('update:modelValue', v))
            " />
          <div
            class="absolute inset-0 -z-1 rounded bg-b-1 shadow-md brightness-lifted" />
        </PopoverPanel>
      </template>
    </ScalarFloating>
  </Popover>
</template>
