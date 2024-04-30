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
    'truncate bg-transparent text-xs font-medium text-fore-2',
    // Interaction
    'cursor-pointer hover:bg-back-2 hover:text-fore-1',
  ],
  variants: {
    disabled: { true: 'pointer-events-none text-fore-3' },
    active: { true: 'bg-back-2 text-fore-1' },
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
