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

import { useBindCx } from '../../hooks/useBindCx'
import { type ExtensionList, isExtensionList } from './types'

import ScalarFileUploadInput from './ScalarFileUploadInput.vue'
import ScalarFileUploadDropTarget from './ScalarFileUploadDropTarget.vue'

const { multiple, accept = '*' } = defineProps<{
  /** Whether multiple files can be uploaded */
  multiple?: boolean
  /**
   * Accepted file types
   * @default '*'
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/accept
   */
  accept?: ExtensionList | string
}>()

const emit = defineEmits<{
  /** Emitted when the user selects files */
  (e: 'selected', value: File[]): void
}>()

/** The selected files */
const files = defineModel<File[]>()

/** The hidden input element */
const input = ref<HTMLInputElement>()

/** Whether the mouse is hovering over the file upload component */
const dragover = ref(false)

/** Opens the file dialog to select files */
function openFileDialog() {
  input.value?.click()
}

/** Handles the change event from the input */
function handleChange(event: Event) {
  const f = (event.target as HTMLInputElement).files
  if (!f) return
  files.value = Array.from(f)
  emit('selected', files.value)
}

/** Handles a drop of files from the dropzone  */
function handleDrop(e: DragEvent) {
  dragover.value = false

  // Use DataTransfer interface to access the file(s)
  if (!e?.dataTransfer?.files || e.dataTransfer.files.length < 1) {
    console.error('No file found to upload')
    return
  }
  const f = [...e.dataTransfer.files]

  if (!multiple && f.length > 1) {
    console.error('Too many files uploaded at once')
    return
  }

  files.value = Array.from(e.dataTransfer.files)
  emit('selected', files.value)
}

defineOptions({ inheritAttrs: false })
const { cx } = useBindCx()
</script>
<template>
  <div
    v-bind="
      cx(
        'flex flex-col relative border border-dashed border-c-3 has-[input:focus-visible]:outline outline-offset-1 rounded',
      )
    "
    @dragenter="dragover = true"
    @dragover.prevent
    @drop.prevent="handleDrop">
    <slot :openFileDialog="openFileDialog">
      <ScalarFileUploadInput
        :extensions="isExtensionList(accept) ? accept : undefined"
        @browse="openFileDialog" />
    </slot>
    <div
      v-if="dragover"
      class="absolute inset-0"
      @dragleave="dragover = false">
      <slot name="drop-target">
        <ScalarFileUploadDropTarget />
      </slot>
    </div>
    <input
      ref="input"
      :accept="isExtensionList(accept) ? accept.join(',') : accept"
      class="sr-only"
      :multiple="multiple"
      type="file"
      @change="handleChange" />
  </div>
</template>
