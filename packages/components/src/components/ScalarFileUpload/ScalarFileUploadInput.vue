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
import { useBindCx } from '@scalar/use-hooks/useBindCx'

import { ScalarButton } from '../ScalarButton'
import type {
  FileUploadInputEmits,
  FileUploadInputProps,
  FileUploadInputSlots,
} from './types'

defineProps<FileUploadInputProps>()
defineEmits<FileUploadInputEmits>()
defineSlots<FileUploadInputSlots>()

defineOptions({ inheritAttrs: false })
const { cx } = useBindCx()
</script>
<template>
  <div v-bind="cx('flex items-center justify-center gap-2 flex-col px-6 py-4')">
    <div class="flex items-center gap-1.5 whitespace-nowrap">
      <span class="text-c-2">
        <slot>Drop {{ multiple ? 'files' : 'file' }} here to upload</slot>
        <span class="text-c-3"> or</span>
      </span>
      <ScalarButton
        size="sm"
        tabindex="-1"
        variant="outlined"
        @click="$emit('click', $event)">
        Browse files
      </ScalarButton>
    </div>
    <slot name="sublabel">
      <div
        v-if="extensions"
        class="text-c-3 text-xs">
        <span class="font-medium">Supported file types:</span>
        {{ extensions.join(', ') }}
      </div>
    </slot>
  </div>
</template>
