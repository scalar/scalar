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
 * The backdrop inherits its border radius from its parent, so set the radius
 * on the floating element itself and the backdrop will follow it
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
      cx(
        'absolute inset-0 -z-1 overflow-hidden rounded-[inherit] bg-b-1 shadow-md',
        // Browsers round sub-pixel borders up to a full pixel, so the hairline
        // is an inset shadow painted above the lifted layer instead
        'after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:shadow-border',
      )
    ">
    <!--
      The lifted brightness lives on an inner layer so it does not also
      brighten the border, which would stop it matching adjacent inputs
    -->
    <div class="absolute inset-0 bg-inherit brightness-lifted">
      <slot />
    </div>
  </div>
</template>
