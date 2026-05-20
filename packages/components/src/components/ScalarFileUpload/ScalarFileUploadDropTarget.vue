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
import { ScalarIconUploadSimple } from '@scalar/icons'
import { useBindCx } from '@scalar/use-hooks/useBindCx'

defineOptions({ inheritAttrs: false })
const { cx } = useBindCx()
</script>
<template>
  <div
    v-bind="
      cx(
        ' size-full flex items-center justify-center absolute inset-0 z-1 rounded p-1 backdrop-blur',
      )
    ">
    <div
      class="pointer-events-none flex size-full items-center justify-center gap-1 rounded-md p-1 text-c-2">
      <ScalarIconUploadSimple class="size-4" />
      <span class="font-medium"><slot>Drop to upload</slot></span>
    </div>
  </div>
</template>
