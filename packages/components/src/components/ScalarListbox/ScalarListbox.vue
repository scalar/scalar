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
  } & Omit<FloatingOptions, 'middleware' | 'offset'>
>()

defineEmits<{
  (e: 'update:modelValue', v: Option): void
}>()

defineOptions({ inheritAttrs: false })

const variants = cva({
  base: [
    // Layout
    'group',
    'text-lef flex min-w-0 items-center gap-1.5 rounded px-2 py-1.5',
    'first-of-type:mt-0.75 last-of-type:mb-0.75',
    // Text / background style
    'truncate bg-transparent text-c-1',
    // Interaction
    'cursor-pointer hover:bg-b-2',
  ],
  variants: {
    selected: { true: 'text-c-1' },
    active: { true: 'bg-b-2' },
    disabled: { true: 'pointer-events-none opacity-50' },
  },
})
</script>
<template>
  <Listbox
    v-slot="{ open }"
    as="div"
    class="text-xs"
    :modelValue="modelValue"
    @update:modelValue="(v) => $emit('update:modelValue', v)">
    <ScalarFloating
      :isOpen="open ?? isOpen"
      :placement="placement ?? 'bottom-start'"
      :resize="resize"
      :teleport="teleport">
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
              <div
                class="flex size-4 items-center justify-center rounded-full p-[3px] group-hover:shadow-border"
                :class="selected ? 'bg-blue text-b-1' : 'text-transparent'">
                <!-- Icon needs help to be optically centered (╥﹏╥) -->
                <ScalarIcon
                  class="relative top-[0.5px] size-2.5 stroke-[1.75]"
                  icon="Checkmark" />
              </div>
              <span class="inline-block min-w-0 flex-1 truncate text-c-1">{{
                option.label
              }}</span>
            </li>
          </ListboxOption>
          <div
            class="absolute inset-0 -z-1 rounded bg-b-1 shadow-md brightness-lifted" />
        </ListboxOptions>
      </template>
    </ScalarFloating>
  </Listbox>
</template>
