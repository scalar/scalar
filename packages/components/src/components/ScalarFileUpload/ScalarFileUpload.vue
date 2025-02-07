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

const { multiple, accept = '*' } = defineProps<{
  multiple?: boolean
  /** @default '*' */
  accept?: ExtensionList | string
}>()

const files = defineModel<File[]>()

const input = ref<HTMLInputElement>()

/** Opens the file dialog to select files */
function openFileDialog() {
  input.value?.click()
}

/** Handles the change event from the input */
function handleChange(event: Event) {
  const f = (event.target as HTMLInputElement).files
  if (!f) return
  files.value = Array.from(f)
}

defineOptions({ inheritAttrs: false })
const { cx } = useBindCx()
</script>
<template>
  <div
    v-bind="
      cx(
        'flex flex-col border border-dashed border-c-3 has-[input:focus-visible]:outline outline-offset-1 rounded',
      )
    ">
    <slot :openFileDialog="openFileDialog">
      <ScalarFileUploadInput
        :extensions="isExtensionList(accept) ? accept : undefined"
        @browse="openFileDialog" />
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
