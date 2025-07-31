<script setup lang="ts">
import { cva, cx } from '@scalar/use-hooks/useBindCx'

const { active, selected } = defineProps<{
  active?: boolean
  selected?: boolean
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
    <slot
      :active
      :selected />
  </li>
</template>
