<script lang="ts">
/**
 * Scalar File Upload component
 *
 * @example
 * <ScalarFileUpload>
 *   <ScalarButton>Click Me</ScalarButton>
 * </ScalarFileUpload>
 */
export default {}
</script>
<script setup lang="ts">
import { ref } from 'vue'
import prettyBytes from 'pretty-bytes'

import { ScalarButton } from '../ScalarButton/'
import { useBindCx } from '../../hooks/useBindCx'
import { type ExtensionList, isExtensionList } from './types'

const { multiple, accept = '*' } = defineProps<{
  multiple?: boolean
  /** @default '*' */
  accept?: ExtensionList | string
}>()

const files = defineModel<FileList>('files')

const input = ref<HTMLInputElement>()

/** Opens the file dialog to select files */
function openFileDialog() {
  input.value?.click()
}

/** Handles the change event from the input */
function handleChange(event: Event) {
  const f = (event.target as HTMLInputElement).files
  if (!f) return
  files.value = f
}

defineOptions({ inheritAttrs: false })
const { cx } = useBindCx()
</script>
<template>
  <div
    v-bind="
      cx(
        'flex flex-col border border-dashed border-c-3 has-[input:focus-visible]:outline-2 rounded',
      )
    ">
    <slot :openFileDialog="openFileDialog">
      <div
        v-if="!files?.length"
        class="flex items-center justify-center gap-2 flex-col px-4 py-3">
        <div class="flex items-center gap-1">
          <span class="text-c-2">
            Drop {{ multiple ? 'files' : 'file' }} here to upload
          </span>
          <span class="text-c-3">or</span>
          <ScalarButton
            size="sm"
            variant="outlined"
            @click="openFileDialog">
            Browse files
          </ScalarButton>
        </div>
        <div class="text-c-3 text-xs">
          <span class="font-medium">Supported file types:</span>
          {{ isExtensionList(accept) ? accept.join(', ') : accept }}
        </div>
      </div>
      <div
        v-else
        class="flex flex-col gap-2 p-4">
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
          <ScalarButton size="sm">Upload</ScalarButton>
          <ScalarButton
            size="sm"
            variant="outlined"
            @click="files = undefined">
            Clear
          </ScalarButton>
        </div>
      </div>
    </slot>
    <input
      ref="input"
      :accept="isExtensionList(accept) ? accept.join(',') : accept"
      class="sr-only"
      :multiple="multiple"
      type="file"
      @change="handleChange" />
  </div>
</template>
