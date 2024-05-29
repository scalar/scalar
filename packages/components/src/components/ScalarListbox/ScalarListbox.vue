<script setup lang="ts">
import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from '@headlessui/vue'

import { cva, cx } from '../../cva'
import { type FloatingOptions, ScalarFloating } from '../ScalarFloating'
import { ScalarIcon } from '../ScalarIcon'
import type { Option } from './types'

defineProps<
  {
    options: Option[]
    modelValue?: Option
  } & Omit<FloatingOptions, 'middleware'>
>()

defineEmits<{
  (e: 'update:modelValue', v: Option): void
}>()

defineOptions({ inheritAttrs: false })

const variants = cva({
  base: [
    // Layout
    'flex min-w-0 items-center gap-2 rounded px-2.5 py-1.5 text-left',
    'first-of-type:mt-0.75 last-of-type:mb-0.75',
    // Text / background style
    'truncate bg-transparent text-xs font-medium text-fore-2',
    // Interaction
    'cursor-pointer hover:bg-back-2 hover:text-fore-1',
  ],
  variants: {
    selected: { true: 'text-fore-1' },
    active: { true: 'bg-back-2 text-fore-1' },
    disabled: { true: 'pointer-events-none opacity-50' },
  },
})
</script>
<template>
  <Listbox
    as="div"
    :modelValue="modelValue"
    @update:modelValue="(v) => $emit('update:modelValue', v)">
    <ScalarFloating
      :placement="placement ?? 'bottom-start'"
      :resize="resize">
      <ListboxButton as="template">
        <slot />
      </ListboxButton>
      <template #floating="{ width }">
        <ListboxOptions
          class="scalar-component relative flex w-40 flex-col p-0.75"
          :style="{ width }"
          v-bind="$attrs">
          <ListboxOption
            v-for="option in options"
            :key="option.id"
            v-slot="{ active, selected }"
            as="template"
            :disabled="option.disabled"
            :value="option">
            <li
              :class="
                cx(variants({ active, selected, disabled: option.disabled }))
              ">
              <span class="inline-block min-w-0 flex-1 truncate">{{
                option.label
              }}</span>
              <ScalarIcon
                v-if="selected"
                icon="Checkmark"
                size="sm" />
            </li>
          </ListboxOption>
          <div
            class="absolute inset-0 -z-1 rounded bg-back-1 shadow-md brightness-lifted" />
        </ListboxOptions>
      </template>
    </ScalarFloating>
  </Listbox>
</template>
