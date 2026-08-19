<script setup lang="ts">
import { ScalarMarkdown } from '@scalar/components/markdown'
import { computed } from 'vue'

import {
  hashMarkdownBlock,
  splitMarkdownBlocks,
} from '@/components/chat-markdown'

/**
 * Markdown renderer for streamed chat messages.
 *
 * Rendering a whole message through one markdown parse per token destroys
 * the DOM of prose that is already final — text selection collapses
 * mid-stream and screen readers re-announce the entire message on every
 * token. This component splits the source into top-level blocks and keys
 * each one by a content hash, so completed blocks never re-mount or
 * re-parse while the trailing block streams.
 *
 * The aria-live contract ships with the memoization because they are one
 * decision: completed blocks live inside a `role="log"` wrapper with
 * `aria-live="polite"`, so each block is announced exactly once — when it
 * completes and enters the log. The in-progress trailing block renders
 * outside that wrapper in a sibling with `aria-live="off"` and moves into
 * the log when it completes (streaming ends, or a new block starts after
 * it).
 */
const { content, streaming = false } = defineProps<{
  /** The full markdown source of the message so far. */
  content: string
  /** True while tokens are still arriving for this message. */
  streaming?: boolean
}>()

const blocks = computed<string[]>(() => splitMarkdownBlocks(content))

/** Every block that is final: while streaming, all but the last one. */
const completedBlocks = computed<string[]>(() =>
  streaming && blocks.value.length > 0
    ? blocks.value.slice(0, -1)
    : blocks.value,
)

/** The still-growing last block; only exists while streaming. */
const trailingBlock = computed<string | undefined>(() =>
  streaming && blocks.value.length > 0
    ? blocks.value[blocks.value.length - 1]
    : undefined,
)
</script>

<template>
  <div class="chat-markdown">
    <!--
      The log wrapper is always rendered so the live region exists before
      content arrives — regions added after the fact are unreliable across
      screen readers.
    -->
    <div
      class="chat-markdown-log"
      role="log"
      aria-live="polite">
      <ScalarMarkdown
        v-for="(block, index) in completedBlocks"
        :key="hashMarkdownBlock(block, index)"
        :value="block" />
    </div>
    <div
      v-if="trailingBlock !== undefined"
      class="chat-markdown-trailing"
      aria-live="off">
      <ScalarMarkdown :value="trailingBlock" />
    </div>
  </div>
</template>

<style scoped>
.chat-markdown {
  font-size: var(--chat-font-prose);
}
</style>
