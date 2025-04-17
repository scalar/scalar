<script lang="ts">
/**
 * Scalar File Upload component
 *
 * @example
 * <ScalarFileUpload @selected="handleSelected" />
 *
 * @example
 * <ScalarFileUpload v-slot="{ open }">
 *   <ScalarButton @click="open">Select files</ScalarButton>
 * </ScalarFileUpload>
 */
export default {}
</script>
<script setup lang="ts">
import { useBindCx } from '@scalar/use-hooks/useBindCx'
import { ref } from 'vue'

import type { LoadingState } from '../ScalarLoading'
import ScalarFileUploadDropTarget from './ScalarFileUploadDropTarget.vue'
import ScalarFileUploadError from './ScalarFileUploadError.vue'
import ScalarFileUploadInput from './ScalarFileUploadInput.vue'
import ScalarFileUploadInputCompact from './ScalarFileUploadInputCompact.vue'
import ScalarFileUploadLoading from './ScalarFileUploadLoading.vue'
import { type ExtensionList, isExtensionList } from './types'

const {
  variant = 'default',
  multiple,
  accept = '*',
} = defineProps<{
  /** Whether multiple files can be uploaded */
  multiple?: boolean
  /**
   * Accepted file types
   * @default '*'
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/accept
   */
  accept?: ExtensionList | string
  /** Whether the file upload is loading */
  loader?: LoadingState
  /** Whether the file upload is compact */
  variant?: 'compact' | 'default'
}>()

const emit = defineEmits<{
  /** Emitted when the user selects files */
  (e: 'selected', value: File[]): void
}>()

defineSlots<{
  /** Override the entire input */
  'default'?: (props: {
    /** Open the file dialog to select files */
    open: () => void
  }) => any
  /** Override the label */
  'label'?: () => any
  /** Override the entire drop target */
  'drop-target'?: () => any
  /** Override the drop target label */
  'drop-target-label'?: () => any
}>()

/** The selected files */
const files = defineModel<File[]>()

/** The error message */
const error = defineModel<string>('error')

/** The hidden input element */
const input = ref<HTMLInputElement>()

/** Whether the mouse is hovering over the file upload component */
const dragover = ref(false)

/** Opens the file dialog to select files */
function openFileDialog() {
  input.value?.click()
}

/** Handles a list of files */
function handleFileList(fileList?: FileList | null) {
  error.value = undefined

  // Use DataTransfer interface to access the file(s)
  if (!fileList || fileList.length < 1) {
    error.value = `No files found to upload`
    return
  }
  const f = Array.from(fileList)

  if (!multiple && f.length > 1) {
    error.value = `Too many files selected`
    return
  }

  files.value = f
  emit('selected', f)
}

/** Handles the change event from the input */
function handleChange(event: Event) {
  const f = (event.target as HTMLInputElement).files
  handleFileList(f)
}

/** Handles a drop of files from the dropzone  */
function handleDrop(e: DragEvent) {
  dragover.value = false
  handleFileList(e.dataTransfer?.files)
}

defineOptions({ inheritAttrs: false })
const { cx } = useBindCx()
</script>
<template>
  <div
    v-bind="
      cx(
        'flex flex-col relative border-dashed border-2 has-[input:focus-visible]:outline outline-offset-1 rounded',
      )
    "
    @dragenter="dragover = true"
    @dragover.prevent
    @drop.prevent="handleDrop">
    <slot :open="openFileDialog">
      <component
        :is="
          variant === 'compact'
            ? ScalarFileUploadInputCompact
            : ScalarFileUploadInput
        "
        :extensions="isExtensionList(accept) ? accept : undefined"
        @click="openFileDialog">
        <template
          v-if="$slots.label"
          #default>
          <slot name="label" />
        </template>
        <template
          v-if="error"
          #sublabel>
          <ScalarFileUploadError>{{ error }}</ScalarFileUploadError>
        </template>
      </component>
    </slot>
    <div
      v-if="dragover"
      class="absolute inset-0"
      @dragleave="dragover = false">
      <slot name="drop-target">
        <ScalarFileUploadDropTarget>
          <template
            v-if="$slots['drop-target-label']"
            #default>
            <slot name="drop-target-label" />
          </template>
        </ScalarFileUploadDropTarget>
      </slot>
    </div>
    <ScalarFileUploadLoading
      v-if="loader?.isLoading"
      :loader="loader" />
    <input
      ref="input"
      :accept="isExtensionList(accept) ? accept.join(',') : accept"
      class="sr-only"
      :multiple="multiple"
      type="file"
      @change="handleChange" />
  </div>
</template>
