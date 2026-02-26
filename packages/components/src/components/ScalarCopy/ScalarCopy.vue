<script lang="ts">
/**
 * Scalar Copy component
 *
 * Provides a copy button and copies content to the clipboard.
 *
 * @example
 *   <ScalarCopy>
 *     <template #copy>Button label</template>
 *     <template #copied>Copied label</template>
 *   </ScalarCopy>
 */
export default {}
</script>
<script setup lang="ts">
import { useClipboard } from '@vueuse/core'
import { onMounted, watch } from 'vue'

import ScalarCopyButton from './ScalarCopyButton.vue'
import type { ScalarCopyProps, ScalarCopySlots } from './types'

const {
  content = '',
  duration = 1500,
  immediate,
} = defineProps<ScalarCopyProps>()

defineSlots<ScalarCopySlots>()

const copied = defineModel<boolean>('copied', { default: false })

onMounted(() => {
  if (immediate) copy(content)
})

const { copy, copied: clipboardCopied } = useClipboard({
  legacy: true,
  copiedDuring: duration,
})

/** Watch the clipboard copied state and emit it to the consuming component */
watch(clipboardCopied, (v) => (copied.value = v))
</script>
<template>
  <ScalarCopyButton
    :copied="copied || clipboardCopied"
    :placement
    :showLabel
    @click="copy(content)">
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
    <template
      v-if="$slots.backdrop"
      #backdrop>
      <slot name="backdrop" />
    </template>
  </ScalarCopyButton>
</template>
