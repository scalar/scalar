<script lang="ts">
/**
 * Scalar floating backdrop component
 *
 * Provides an absolutely positioned surface behind a floating element
 *
 * The backdrop inherits its border radius from its parent, so set the radius
 * on the floating element itself and the backdrop will follow it
 *
 * @deprecated The Scalar floating components now paint their own surface, so
 * style the floating element directly instead, e.g.
 * `rounded-xl bg-b-1 dark:bg-b-1.5 shadow-md inset-shadow-border`
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
        'absolute inset-0 -z-1 rounded-[inherit] bg-b-1 dark:bg-b-1.5 shadow-md inset-shadow-border',
      )
    ">
    <slot />
  </div>
</template>
