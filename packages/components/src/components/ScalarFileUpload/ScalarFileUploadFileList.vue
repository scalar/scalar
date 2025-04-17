<script lang="ts">
/**
 * Scalar File Upload File List
 *
 * Displays a list of files
 *
 * @example
 * <ScalarFileUploadFileList :files="files" />
 */
export default {}
</script>
<script setup lang="ts">
import { useBindCx } from '@scalar/use-hooks/useBindCx'
import prettyBytes from 'pretty-bytes'

import { ScalarButton } from '../ScalarButton'

defineEmits<{
  /** Emitted when the user clicks the upload button */
  (e: 'upload'): void
}>()

/** The files to display */
const files = defineModel<File[]>()

defineOptions({ inheritAttrs: false })
const { cx } = useBindCx()
</script>
<template>
  <div v-bind="cx('flex flex-col gap-2 p-4')">
    <div class="text-c-2">Selected files:</div>
    <ul
      v-for="file in files"
      :key="file.name"
      class="flex flex-col gap-0.5">
      <li class="border rounded p-1 text-xs">
        <div class="flex items-center justify-between">
          <div class="flex-1 min-w-0 truncate">
            {{ file.name }}
          </div>
          <div class="text-c-3">{{ prettyBytes(file.size) }}</div>
        </div>
      </li>
    </ul>
    <div class="flex items-center gap-1.5">
      <ScalarButton
        size="sm"
        @click="$emit('upload')">
        Upload
      </ScalarButton>
      <ScalarButton
        size="sm"
        variant="outlined"
        @click="files = []">
        Clear
      </ScalarButton>
    </div>
  </div>
</template>
