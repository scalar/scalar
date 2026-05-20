<script lang="ts">
/**
 * Scalar floating backdrop component
 *
 * Provides an absolutely positioned backdrop for the floating element
 * This is used internally by a number of the Scalar floating components
 * (e.g. Dropdown, Popover, Listbox)
 *
 * You can use this component directly if you need to customize the backdrop
 * for a floating component
 *
 * @example
 * <ScalarDropdown>
 *   <!-- Menu stuff -->
 *   <template #backdrop>
 *     <ScalarFloatingBackdrop />
 *   </template>
 * </ScalarDropdown>
 */
export default {}
</script>
<script setup lang="ts">
import { useBindCx } from '@scalar/use-hooks/useBindCx'

defineOptions({ inheritAttrs: false })
const { cx } = useBindCx()
</script>
<template>
  <div
    v-bind="
      cx('absolute inset-0 -z-1 rounded bg-b-1 shadow-lg brightness-lifted')
    ">
    <slot />
  </div>
</template>
