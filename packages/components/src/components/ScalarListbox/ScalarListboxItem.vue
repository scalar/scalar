<script setup lang="ts">
import { ListboxOption } from '@headlessui/vue'
import { cva, cx } from '@scalar/use-hooks/useBindCx'

import ScalarListboxCheckbox from './ScalarListboxCheckbox.vue'
import type { Option, OptionStyle } from './types'

defineProps<{
  option: Option
  style?: OptionStyle
}>()

const variants = cva({
  base: [
    // Layout
    'group/item',
    'flex min-w-0 items-center gap-1.5 rounded px-2 py-1.5 text-left',
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
      <ScalarListboxCheckbox
        :selected="selected"
        :style="style" />
      <span
        class="inline-block min-w-0 flex-1 truncate"
        :class="option.color ? option.color : 'text-c-1'">
        {{ option.label }}
      </span>
    </li>
  </ListboxOption>
</template>
