<script setup lang="ts">
import { cva, cx } from '@scalar/use-hooks/useBindCx'

import { ScalarIcon } from '../ScalarIcon'
import {
  ScalarListboxCheckbox,
  type ScalarListboxOptionStyle,
} from '../ScalarListbox'

defineProps<{
  active?: boolean
  selected?: boolean
  style?: ScalarListboxOptionStyle
  isDeletable?: boolean
}>()

defineEmits<{
  (e: 'delete'): void
}>()

const variants = cva({
  base: [
    // Group
    'group/item',
    // Layout
    'flex min-w-0 items-center gap-1.5 rounded px-2 py-1.5 text-left',
    // Text / background style
    'truncate bg-transparent text-c-1',
    // Interaction
    'cursor-pointer hover:bg-b-2',
  ],
  variants: {
    selected: { true: 'text-c-1' },
    active: { true: 'bg-b-2' },
  },
})
</script>
<template>
  <li
    :aria-selected="selected"
    :class="cx(variants({ active, selected }))"
    role="option"
    tabindex="-1">
    <ScalarListboxCheckbox
      :selected="selected"
      :style="style" />
    <span class="inline-block min-w-0 flex-1 truncate text-c-1"><slot /></span>
    <ScalarIcon
      v-if="isDeletable"
      aria-label="Delete"
      class="text-c-2 opacity-0 group-hover/item:opacity-100"
      icon="Delete"
      size="md"
      thickness="1.5"
      @click.stop="$emit('delete')" />
  </li>
</template>
