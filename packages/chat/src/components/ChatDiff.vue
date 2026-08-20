<script setup lang="ts">
import { computed } from 'vue'

import { formatChatCopy, useChatCopy } from '@/copy/copy'

/** One rendered diff line; `line` is null for removed rows, which have no line in the new file. */
type Row = { line: number | null; text: string }

/**
 * The unified diff hunk renderer used inside tool-card bodies.
 *
 * Ported from the editor's `EditorAgentDiff` — kit-internal imports only, so
 * any surface can show a hunk without pulling a diff library. Rows arrive
 * pre-split into context/removed/added groups because the tool results
 * already carry them that way; the component only lays them out.
 */
const {
  contextBefore = [],
  removed = [],
  added = [],
  contextAfter = [],
  lineNumberHint = null,
} = defineProps<{
  contextBefore?: Row[]
  removed?: Row[]
  added?: Row[]
  contextAfter?: Row[]
  /** Fallback start line for hunks whose rows carry no line numbers. */
  lineNumberHint?: number | null
}>()

const copy = useChatCopy()

const hunkLabel = computed<string | null>(() => {
  // Span every numbered row, not just the trailing context: a change with no
  // trailing context (lines added at the end of a file) would otherwise be
  // mislabeled as a single line. Removed rows carry no new-file line number.
  const lineNumbers = [...contextBefore, ...added, ...contextAfter]
    .map((row) => row.line)
    .filter((line): line is number => line !== null && line !== undefined)

  const start =
    lineNumbers.length > 0 ? Math.min(...lineNumbers) : (lineNumberHint ?? null)

  if (start === null) {
    return null
  }

  const end = lineNumbers.length > 0 ? Math.max(...lineNumbers) : start

  if (end !== start) {
    return formatChatCopy(copy.diff.lines, { start, end })
  }

  return formatChatCopy(copy.diff.line, { line: start })
})

const showHunkBar = computed<boolean>(
  () =>
    !!hunkLabel.value &&
    (contextBefore.length > 0 ||
      removed.length > 0 ||
      added.length > 0 ||
      contextAfter.length > 0),
)
</script>

<template>
  <div class="chat-diff">
    <div
      v-if="showHunkBar"
      class="chat-diff-hunk">
      {{ hunkLabel }}
    </div>

    <div class="chat-diff-rows">
      <div
        v-for="(row, i) in contextBefore"
        :key="`before-${i}`"
        class="chat-diff-row chat-diff-row--context">
        <span class="chat-diff-line">{{ row.line ?? '' }}</span>
        <span class="chat-diff-sign">&nbsp;</span>
        <span class="chat-diff-text">{{ row.text }}</span>
      </div>

      <div
        v-for="(row, i) in removed"
        :key="`removed-${i}`"
        class="chat-diff-row chat-diff-row--removed">
        <span class="chat-diff-line"></span>
        <span class="chat-diff-sign">−</span>
        <span class="chat-diff-text">{{ row.text }}</span>
      </div>

      <div
        v-for="(row, i) in added"
        :key="`added-${i}`"
        class="chat-diff-row chat-diff-row--added">
        <span class="chat-diff-line">{{ row.line ?? '' }}</span>
        <span class="chat-diff-sign">+</span>
        <span class="chat-diff-text">{{ row.text }}</span>
      </div>

      <div
        v-for="(row, i) in contextAfter"
        :key="`after-${i}`"
        class="chat-diff-row chat-diff-row--context">
        <span class="chat-diff-line">{{ row.line ?? '' }}</span>
        <span class="chat-diff-sign">&nbsp;</span>
        <span class="chat-diff-text">{{ row.text }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chat-diff {
  font-family: var(--scalar-font-code);
  font-size: 12px;
  line-height: 1.55;
  background: var(--scalar-background-1);
  max-height: 380px;
  overflow-y: auto;
  overflow-x: auto;
  overscroll-behavior: none;
}

.chat-diff-hunk {
  position: sticky;
  top: 0;
  z-index: 1;
  display: block;
  padding: 4px 8px;
  font-family: var(--scalar-font-code);
  font-size: var(--scalar-font-size-4);
  text-transform: uppercase;
  color: var(--scalar-color-3);
  background: var(--scalar-background-2);
  border-bottom: var(--scalar-border-width) solid var(--scalar-border-color);
}

.chat-diff-rows {
  display: block;
  padding: 4px 0;
  min-width: max-content;
}

.chat-diff-row {
  display: grid;
  grid-template-columns: 36px 16px 1fr;
  align-items: baseline;
  white-space: pre;
  min-height: 18px;
}

.chat-diff-row--context {
  color: var(--scalar-color-2);
}

.chat-diff-row--removed {
  background: color-mix(in oklch, var(--scalar-color-red) 8%, transparent);
}

.chat-diff-row--added {
  background: color-mix(in oklch, var(--scalar-color-green) 8%, transparent);
}

.chat-diff-line {
  display: inline-block;
  padding: 0 8px 0 0;
  text-align: right;
  color: var(--scalar-color-3);
  font-variant-numeric: tabular-nums;
  font-size: 11px;
  user-select: none;
}

.chat-diff-sign {
  display: inline-block;
  text-align: center;
  font-weight: var(--scalar-semibold);
  user-select: none;
}

.chat-diff-row--removed .chat-diff-sign {
  color: var(--scalar-color-red);
}

.chat-diff-row--added .chat-diff-sign {
  color: var(--scalar-color-green);
}

.chat-diff-text {
  display: inline-block;
  padding-right: 12px;
  color: var(--scalar-color-1);
  white-space: pre;
}

.chat-diff-row--context .chat-diff-text {
  color: var(--scalar-color-2);
}
</style>
