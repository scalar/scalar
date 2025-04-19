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

import { ScalarIcon } from '../ScalarIcon'
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
  <button
    type="button"
    v-bind="
      cx(
        'flex items-center justify-center gap-1 rounded flex-col px-4 py-3 hover:bg-b-2',
      )
    "
    @click="$emit('click', $event)">
    <div class="flex items-center gap-1 whitespace-nowrap text-c-2">
      <slot>
        <ScalarIcon
          icon="Upload"
          size="sm" />
        <span> Upload {{ multiple ? 'files' : 'file' }} </span>
      </slot>
    </div>
    <slot name="sublabel">
      <div
        v-if="extensions"
        class="text-c-3 text-xs">
        {{ extensions.join(', ') }}
      </div>
    </slot>
  </button>
</template>
