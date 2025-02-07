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
import { ScalarIcon } from '../ScalarIcon/'
import { useBindCx } from '../../hooks/useBindCx'

defineOptions({ inheritAttrs: false })
const { cx } = useBindCx()
</script>
<template>
  <div
    v-bind="
      cx(
        ' size-full flex items-center justify-center bg-b-1 bg-mix-transparent bg-mix-amount-25 absolute inset-0 z-1 rounded p-1 backdrop-blur',
      )
    ">
    <div
      class="pointer-events-none flex size-full items-center justify-center gap-1 rounded-md p-1 text-c-2">
      <ScalarIcon
        class="size-4"
        icon="UploadSimple" />
      <span class="font-medium">Drop to upload</span>
    </div>
  </div>
</template>
