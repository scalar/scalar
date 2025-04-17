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
import { useBindCx } from '@scalar/use-hooks/useBindCx'

import { ScalarIcon } from '../ScalarIcon'

defineOptions({ inheritAttrs: false })
const { cx } = useBindCx()
</script>
<template>
  <div v-bind="cx('flex items-center gap-1 text-c-danger')">
    <ScalarIcon
      icon="Error"
      size="sm" />
    <slot />
  </div>
</template>
