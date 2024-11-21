<script setup lang="ts">
import { ListboxOption } from '@headlessui/vue'

import { cva, cx } from '../../cva'
import { ScalarIcon } from '../ScalarIcon'
import type { Option } from './types'

defineProps<{
  option: Option
}>()

const variants = cva({
  base: [
    // Layout
    'group/listbox',
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
  <ListboxOption
    v-slot="{ active, selected }"
    as="template"
    :disabled="option.disabled"
    :value="option">
    <li :class="cx(variants({ active, selected, disabled: option.disabled }))">
      <div
        class="flex size-4 items-center justify-center rounded-full p-[3px]"
        :class="
          selected
            ? 'bg-c-accent text-b-1'
            : 'text-transparent group-hover/listbox:shadow-border'
        ">
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
</template>
