<script lang="ts">
/**
 * Scalar header column component
 *
 * A section of a `ScalarHeader`. Columns hug their content, so pass `flex-1` to
 * take the free space and `justify-center` / `justify-end` to place the contents.
 *
 * Carries `min-w-0` so a column can shrink below its contents and long titles
 * ellipsize instead of widening the header.
 *
 * @example
 * ```html
 * <ScalarHeaderColumn class="flex-1">
 *   <ScalarMenu />
 * </ScalarHeaderColumn>
 * ```
 */
export default {}
</script>
<script setup lang="ts">
import { useBindCx } from '@scalar/use-hooks/useBindCx'

defineSlots<{
  /** The contents of the column */
  default?(): unknown
}>()

defineOptions({ inheritAttrs: false })
const { cx } = useBindCx()
</script>
<template>
  <div v-bind="cx('flex min-w-0 shrink-0 items-center justify-start gap-1')">
    <slot />
  </div>
</template>
