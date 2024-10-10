<script setup lang="ts">
import {
  Listbox,
  ListboxButton,
  ListboxLabel,
  ListboxOption,
  ListboxOptions,
} from '@headlessui/vue'

import { cva, cx } from '../../cva'
import { type FloatingOptions, ScalarFloating } from '../ScalarFloating'
import { ScalarIcon } from '../ScalarIcon'
import type { Option } from './types'

withDefaults(
  defineProps<
    {
      /**
       * Allow selecting multiple values
       *
       * @default false
       */
      multiple?: boolean
      options: Option[]
      modelValue?: Option | Option[]
      fullWidth?: boolean
      id?: string
      label?: string
    } & Omit<FloatingOptions, 'middleware' | 'offset' | 'targetRef'>
  >(),
  { multiple: false },
)

defineEmits<{
  (e: 'update:modelValue', v: Option): void
}>()

defineOptions({ inheritAttrs: false })

const variants = cva({
  base: [
    // Layout
    'group',
    'flex min-w-0 items-center gap-1.5 rounded px-2 py-1.5 text-left',
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
    :class="[{ 'w-full': fullWidth }, 'text-sm']"
    :modelValue="modelValue"
    :multiple="multiple"
    @update:modelValue="(v) => $emit('update:modelValue', v)">
    <ListboxLabel
      v-if="label"
      class="sr-only">
      {{ label }}
    </ListboxLabel>
    <ScalarFloating
      :isOpen="open ?? isOpen"
      :placement="placement ?? 'bottom-start'"
      :resize="resize"
      :teleport="teleport">
      <ListboxButton
        :id="id"
        as="template"
        class="justify-start focus:outline-none focus-visible:ring-1 focus-visible:ring-c-accent">
        <slot />
      </ListboxButton>
      <template #floating="{ width }">
        <ListboxOptions
          class="relative flex w-40 flex-col rounded border p-0.75"
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
                  class="relative top-[0.5px] size-2.5"
                  icon="Checkmark"
                  thickness="2.5" />
              </div>
              <span
                class="inline-block min-w-0 flex-1 truncate"
                :class="option.color ? option.color : 'text-c-1'">
                {{ option.label }}
              </span>
            </li>
          </ListboxOption>
          <div
            class="absolute inset-0 -z-1 rounded bg-b-1 shadow-md brightness-lifted" />
        </ListboxOptions>
      </template>
    </ScalarFloating>
  </Listbox>
</template>
