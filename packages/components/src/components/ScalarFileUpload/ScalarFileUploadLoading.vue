<script lang="ts">
/**
 * Scalar File Upload Input
 *
 * Displays a label and button for file uploads
 *
 * @example
 * <ScalarFileUploadInput />
 */
export default {}
</script>
<script setup lang="ts">
import { useBindCx } from '../../hooks/useBindCx'
import { ScalarLoading, type LoadingState } from '../ScalarLoading'

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
