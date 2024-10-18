<script setup lang="ts">
import { cva, cx } from '../../cva'
import { ScalarIcon } from '../ScalarIcon'

defineProps<{
  active?: boolean
  selected?: boolean
  style?: 'radio' | 'checkbox'
  isDeletable?: boolean
}>()

const variants = cva({
  base: [
    // Layout
    'group',
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
  <li :class="cx(variants({ active, selected }), 'group')">
    <div
      class="flex size-4 items-center justify-center p-0.75"
      :class="[
        selected
          ? 'bg-c-accent text-b-1'
          : 'text-transparent group-hover:shadow-border',
        style === 'checkbox' ? 'rounded' : 'rounded-full',
      ]">
      <!-- Icon needs help to be optically centered (╥﹏╥) -->
      <ScalarIcon
        class="relative top-[0.5px] size-2.5"
        icon="Checkmark"
        thickness="2.5" />
    </div>
    <span class="inline-block min-w-0 flex-1 truncate text-c-1"><slot /></span>
    <ScalarIcon
      v-if="isDeletable"
      class="text-c-2 opacity-0 group-hover:opacity-100"
      icon="Delete"
      size="md"
      thickness="1.5"
      @click.stop="$emit('delete')" />
  </li>
</template>
