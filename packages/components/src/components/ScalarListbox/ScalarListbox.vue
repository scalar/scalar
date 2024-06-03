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
    'group',
    'flex min-w-0 items-center gap-2.5 rounded px-2.5 py-1.5 text-left',
    'first-of-type:mt-0.75 last-of-type:mb-0.75',
    // Text / background style
    'text-c-1 truncate bg-transparent text-xs',
    // Interaction
    'hover:bg-b-2 cursor-pointer',
  ],
  variants: {
    selected: { true: 'text-c-1' },
    active: { true: 'text-c-1 bg-back-2' },
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
          class="relative flex w-40 flex-col p-0.75"
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
              <ScalarIcon
                class="group-hover rounded-full stroke-[1.75] p-[3px] group-hover:shadow-[inset_0_0_0_1px_var(--scalar-border-color)]"
                :class="
                  selected
                    ? 'text-b-1 bg-blue shadow-[inset_0_0_0_1px_var(--scalar-border-color)]'
                    : 'text-transparent'
                "
                icon="Checkmark"
                size="md" />
              <span class="text-c-1 inline-block min-w-0 flex-1 truncate">{{
                option.label
              }}</span>
            </li>
          </ListboxOption>
          <div
            class="bg-b-1 absolute inset-0 -z-1 rounded shadow-md brightness-lifted" />
        </ListboxOptions>
      </template>
    </ScalarFloating>
  </Listbox>
</template>
