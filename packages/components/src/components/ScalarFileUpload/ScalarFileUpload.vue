<script lang="ts">
/**
 * Scalar File Upload component
 *
 * @example
 * <ScalarFileUpload>
 *   <ScalarButton>Click Me</ScalarButton>
 * </ScalarFileUpload>
 */
export default {}
</script>
<script setup lang="ts">
import { useBindCx } from '../../hooks/useBindCx'

defineOptions({ inheritAttrs: false })
const { cx } = useBindCx()
</script>
<template>
  <div v-bind="cx('flex')">
    <slot />
  </div>
</template>
