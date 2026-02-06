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

import ScalarCopyButton from './ScalarCopyButton.vue'
import type { ScalarCopyProps, ScalarCopySlots } from './types'

const { content = '', duration = 1500 } = defineProps<ScalarCopyProps>()

defineSlots<ScalarCopySlots>()

const { copy, copied } = useClipboard({ legacy: true, copiedDuring: duration })
</script>
<template>
  <ScalarCopyButton
    :placement
    :copied
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
  </ScalarCopyButton>
</template>
