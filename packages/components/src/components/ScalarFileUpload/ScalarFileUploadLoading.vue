<script lang="ts">
/**
 * Scalar File Upload Loading
 *
 * Displays a loading state for file uploads
 *
 * @example
 * <ScalarFileUploadLoading :loader="loader" />
 */
export default {}
</script>
<script setup lang="ts">
import { useBindCx } from '@scalar/use-hooks/useBindCx'

import { type LoadingState, ScalarLoading } from '../ScalarLoading'

defineProps<{
  loader: LoadingState
}>()

defineOptions({ inheritAttrs: false })
const { cx } = useBindCx()
</script>
<template>
  <div
    v-bind="
      cx(
        ' size-full flex items-center justify-center bg-b-1 bg-mix-transparent bg-mix-amount-25 absolute inset-0 z-1 rounded p-1 backdrop-blur text-c-2',
      )
    ">
    <ScalarLoading
      :loadingState="loader"
      size="md" />
  </div>
</template>
