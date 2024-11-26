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
import { cva, cx } from '../../cva'

defineProps<{
  active?: boolean
  disabled?: boolean
}>()

defineEmits<{
  (e: 'click', event: MouseEvent): void
}>()

const variants = cva({
  base: [
    // Layout
    'h-8 min-w-0 items-center gap-1.5 rounded px-2.5 py-1.5 text-left',
    // Text / background style
    'truncate text-sm text-c-1',
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
  <button
    class="item"
    :class="cx('scalar-dropdown-item', variants({ active, disabled }))"
    type="button"
    @click="($event) => $emit('click', $event)">
    <slot />
  </button>
</template>
<style scoped>
.dark-mode .scalar-dropdown-item:hover {
  filter: brightness(1.1);
}
</style>
