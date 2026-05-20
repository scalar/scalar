<script lang="ts">
/**
 * Scalar Copy Backdrop component
 *
 * A backdrop for the copy button label, this component can be
 * used to override the default backdrop with a custom one.
 *
 * @example
 * <ScalarCopy>
 *   <template #backdrop>
 *     <ScalarCopyBackdrop class="bg-b-2" />
 *   </template>
 * </ScalarCopy>
 */
export default {}
</script>
<script setup lang="ts">
import { useBindCx } from '@scalar/use-hooks/useBindCx'

defineOptions({ inheritAttrs: false })
const { cx } = useBindCx()
</script>
<template>
  <div v-bind="cx('absolute inset-y-0.5 -z-2 left-0 right-0 bg-b-1 rounded')" />
</template>
