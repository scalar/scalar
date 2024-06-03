<script setup lang="ts">
import { MenuItem } from '@headlessui/vue'

import { cva, cx } from '../../cva'

defineProps<{
  disabled?: boolean
}>()

defineEmits<{
  (e: 'click', event: MouseEvent): void
}>()

const variants = cva({
  base: [
    // Layout
    'min-w-0 items-center gap-3 rounded px-2.5 py-1.5 text-left',
    'first-of-type:mt-0.75 last-of-type:mb-0.75',
    // Text / background style
    'text-c-1 truncate bg-transparent text-xs',
    // Interaction
    'hover:bg-b-2 hover:text-c-1 cursor-pointer',
  ],
  variants: {
    disabled: { true: 'text-c-3 pointer-events-none' },
    active: { true: 'bg-b-2 text-c-1' },
  },
})
</script>
<template>
  <MenuItem
    v-slot="{ active }"
    :disabled="disabled">
    <button
      class="item"
      :class="cx('scalar-dropdown-item', variants({ active, disabled }))"
      type="button"
      @click="($event) => $emit('click', $event)">
      <slot />
    </button>
  </MenuItem>
</template>
