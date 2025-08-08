<script setup lang="ts">
import { ScalarIconCheck, ScalarIconCopy } from '@scalar/icons'
import { cva, cx } from '@scalar/use-hooks/useBindCx'
import { useClipboard } from '@scalar/use-hooks/useClipboard'
import { ref } from 'vue'

import { ScalarButton } from '../ScalarButton'

const {
  content,
  controls,
  class: className,
} = defineProps<{
  /** Content to copy to clipboard */
  content: string | object
  /** ID of the parent element this button controls */
  controls?: string
  /** Class to apply to the copy button */
  class?: string
}>()

/** Copy to clipboard hook */
const { copyToClipboard } = useClipboard()

/** Whether the copy button has been clicked */
const showCopied = ref(false)

/** Handles the copy button click */
const handleCopy = async () => {
  if (showCopied.value) {
    return
  }

  const contentToCopy =
    typeof content === 'string' ? content : JSON.stringify(content, null, 2)

  await copyToClipboard(contentToCopy)
  showCopied.value = true

  setTimeout(() => {
    showCopied.value = false
  }, 1200)
}

/** Variants for the copy button */
const variants = cva({
  base: 'absolute top-0 right-0 h-8 w-8 p-0 flex items-center justify-center brightness-lifted bg-inherit rounded focus-visible:opacity-100 -outline-offset-1',
  variants: {
    showCopied: {
      true: 'text-c-1',
      false: 'text-c-3 hover:text-c-1',
    },
  },
})
</script>

<template>
  <div
    :class="
      cx(
        'scalar-code-copy opacity-0 group-hover/code-block:opacity-100 sticky flex inset-0 justify-end items-start bg-inherit',
        className,
      )
    ">
    <ScalarButton
      :class="cx(variants({ showCopied }))"
      type="button"
      variant="ghost"
      :aria-controls="controls"
      aria-label="Copy"
      @click="handleCopy">
      <ScalarIconCopy
        class="copy-icon size-4"
        :class="{ copied: showCopied }" />
      <ScalarIconCheck
        class="check-icon size-4"
        :class="{ visible: showCopied }" />
    </ScalarButton>
    <div
      v-if="showCopied"
      role="alert"
      class="sr-only">
      Copied
    </div>
  </div>
</template>

<style scoped>
.scalar-code-block:hover .scalar-code-copy {
  opacity: 100;
}

.copy-icon,
.check-icon {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) scale(1);
  transition: transform 0.15s ease-in-out;
}

.copy-icon.copied {
  transform: translate(-50%, -50%) scale(0);
}

.check-icon {
  transform: translate(-50%, -50%) scale(0);
}

.check-icon.visible {
  transform: translate(-50%, -50%) scale(1);
}
</style>
