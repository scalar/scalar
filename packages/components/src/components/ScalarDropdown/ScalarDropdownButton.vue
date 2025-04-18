<script lang="ts">
/**
 * Scalar dropdown button base component
 *
 * Provide a styled button for the ScalarDropdown or similar
 *
 * This is used internally by the ScalarDropdownItem component
 *
 * If you're looking to add items to a dropdown menu you
 * probably want the ScalarDropdownItem component
 *
 * @example
 * <ScalarDropdownButton ＠click="handleClick">
 *   Label
 * </ScalarDropdownButton>
 */
export default {}
</script>
<script setup lang="ts">
import { cva, cx } from '@scalar/use-hooks/useBindCx'
import type { Component } from 'vue'

const { is = 'button' } = defineProps<{
  is?: string | Component
  active?: boolean
  disabled?: boolean
}>()

const variants = cva({
  base: [
    // Layout
    'flex h-8 min-w-0 items-center gap-1.5 rounded px-2.5 py-1.5 text-left',
    // Text / background style
    'truncate  no-underline text-sm text-c-1',
    // Interaction
    'cursor-pointer hover:bg-b-2 hover:text-c-1',
  ],
  variants: {
    disabled: { true: 'pointer-events-none text-c-3' },
    active: { true: 'bg-b-2 text-c-1' },
  },
})
</script>
<template>
  <component
    :is="is"
    class="item"
    :class="cx('scalar-dropdown-item', variants({ active, disabled }))"
    :type="is === 'button' ? 'button' : undefined">
    <slot />
  </component>
</template>
<style scoped>
.dark-mode .scalar-dropdown-item:hover {
  filter: brightness(1.1);
}
</style>
