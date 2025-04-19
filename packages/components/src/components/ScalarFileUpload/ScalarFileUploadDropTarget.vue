<script lang="ts">
/**
 * Scalar File Upload Drop Target
 *
 * Displays a drop target for file uploads (used when
 * the user is dragging files over the component)
 *
 * @example
 * <ScalarFileUploadDropTarget />
 */
export default {}
</script>
<script setup lang="ts">
import { useBindCx } from '@scalar/use-hooks/useBindCx'

import { ScalarIcon } from '../ScalarIcon/'

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
        icon="Upload" />
      <span class="font-medium"><slot>Drop to upload</slot></span>
    </div>
  </div>
</template>
