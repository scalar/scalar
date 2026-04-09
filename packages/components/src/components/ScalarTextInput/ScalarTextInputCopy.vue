<script lang="ts">
/**
 * Scalar Text Input Copy component
 *
 * A wrapper around the ScalarTextInput component that provides a
 * copy button and allows copying of the input content to the clipboard.
 *
 * @example
 *   <ScalarTextInputCopy v-model="model" />
 */
export default {}
</script>
<script setup lang="ts">
import { useClipboard } from '@vueuse/core'
import { onMounted, watch } from 'vue'

import { ScalarCopyBackdrop, ScalarCopyButton } from '../ScalarCopy'
import ScalarTextInput from './ScalarTextInput.vue'

const { duration = 1500, immediate } = defineProps<{
  /** The placement of the copy button */
  duration?: number
  /** Whether the input is writable */
  editable?: boolean
  /** Whether to copy the model value immediately on mount */
  immediate?: boolean
}>()

defineSlots<{
  /* Text content to display before the input text */
  prefix?: () => unknown
  /*Text content to display after the input text */
  suffix?: () => unknown
  /* Text content to display to the right of the input */
  aside?: () => unknown
  /* Override the label for the copy button */
  copy?: () => unknown
  /* Override the label for the copy button when the content has been copied */
  copied?: () => unknown
}>()

onMounted(() => {
  // Copy the model value immediately on mount if immediate is true
  if (immediate && model.value) copy(model.value)
})

const model = defineModel<string>()

const copied = defineModel<boolean>('copied', { default: false })

const { copy, copied: clipboardCopied } = useClipboard({
  legacy: true,
  copiedDuring: duration,
})

/** Watch the clipboard copied state and emit it to the consuming component */
watch(clipboardCopied, (v) => (copied.value = v))
</script>
<template>
  <ScalarTextInput
    v-model="model"
    :readonly="!editable"
    @click="model && copy(model)">
    <template #aside>
      <ScalarCopyButton
        class="z-1"
        :copied="copied || clipboardCopied"
        placement="left"
        @click.stop="model && copy(model)">
        <template
          v-if="$slots.copy"
          #copy>
          <slot name="copy" />
        </template>
        <template
          v-if="$slots.copied"
          #copied>
          <slot name="copied" />
        </template>
        <template #backdrop>
          <ScalarCopyBackdrop class="bg-b-1.5" />
        </template>
      </ScalarCopyButton>
    </template>
  </ScalarTextInput>
</template>
