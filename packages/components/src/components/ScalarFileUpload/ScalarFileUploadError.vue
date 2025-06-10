<script lang="ts">
/**
 * Scalar File Upload Error
 *
 * Displays an error message
 *
 * @example
 * <ScalarFileUploadError>
 *   <!-- Error message -->
 * </ScalarFileUploadError>
 */
export default {}
</script>
<script setup lang="ts">
import { ScalarIconWarningCircle } from '@scalar/icons'
import { useBindCx } from '@scalar/use-hooks/useBindCx'

defineOptions({ inheritAttrs: false })
const { cx } = useBindCx()
</script>
<template>
  <div v-bind="cx('flex items-center gap-1 text-c-danger')">
    <ScalarIconWarningCircle class="size-3.5" />
    <slot />
  </div>
</template>
