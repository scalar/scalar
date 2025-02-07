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
import { ScalarButton } from '../ScalarButton'
import { useBindCx } from '../../hooks/useBindCx'
import type { ExtensionList } from './types'

defineProps<{
  /** Whether multiple files can be uploaded */
  multiple?: boolean
  /** A list of extensions that are supported */
  extensions?: ExtensionList
}>()

defineEmits<{
  /** Emitted when the user clicks the browse button */
  (e: 'browse'): void
}>()

defineOptions({ inheritAttrs: false })
const { cx } = useBindCx()
</script>
<template>
  <div v-bind="cx('flex items-center justify-center gap-2 flex-col px-4 py-4')">
    <div class="flex items-center gap-1 whitespace-nowrap">
      <span class="text-c-2">
        <slot name="label">
          Drop {{ multiple ? 'files' : 'file' }} here to upload
        </slot>
      </span>
      <span class="text-c-3">or</span>
      <ScalarButton
        size="sm"
        tabindex="-1"
        variant="outlined"
        @click="$emit('browse')">
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
