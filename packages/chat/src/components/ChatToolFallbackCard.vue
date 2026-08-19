<script setup lang="ts">
import {
  toolCardStatus,
  type ToolCardStatus,
  type ToolPartLike,
} from '@scalar/chat-protocol'
import { describeDynamicTool } from '@scalar/chat-protocol/tools/dynamic'
import { ScalarCodeBlock } from '@scalar/components/code-block'
import {
  ScalarIconCaretDown,
  ScalarIconCheck,
  ScalarIconWarning,
  ScalarIconWrench,
} from '@scalar/icons'
import { computed, ref } from 'vue'

import { formatChatCopy, useChatCopy } from '@/copy/copy'

/**
 * The primary renderer for dynamic and otherwise unknown tools.
 *
 * MCP installations expose curated per-operation tools whose names a client
 * can never know statically, so this card is a first-class renderer, not a
 * safety net (see the dynamic-tool model in `@scalar/chat-protocol`). It is a
 * collapsible card: the header button toggles the expanded state, the
 * collapsed view shows a one-line preview, and the expanded view shows the
 * raw arguments and result as JSON.
 *
 * Two deliberate deviations from the donor `McpChatToolCall` per design
 * ruling A11: the condensed preview is a one-line CSS clamp instead of a
 * JS character truncation (only a generous slice guards render size), and
 * status derives from the canonical `toolCardStatus` machine instead of a
 * local re-interpretation of part states.
 */
const {
  part,
  awaitingApproval = false,
  applying = false,
} = defineProps<{
  /** The tool part to render, static or dynamic. */
  part: ToolPartLike
  /** Whether the local approval store is holding this call for a decision. */
  awaitingApproval?: boolean
  /** Whether an approved client-side executor is currently running. */
  applying?: boolean
}>()

const copy = useChatCopy()

const expanded = ref(false)

const status = computed<ToolCardStatus>(() =>
  toolCardStatus(part, { awaitingApproval, applying }),
)

const description = computed(() => describeDynamicTool(part))

// A dynamic part can arrive without a tool name; the raw part type is data
// (not copy), so it is an acceptable last-resort identifier.
const toolName = computed<string>(() => description.value.name || part.type)

const isTerminal = computed<boolean>(
  () =>
    status.value === 'complete' ||
    status.value === 'failed' ||
    status.value === 'rejected',
)

/**
 * The copy template narrating the header, chosen by status. Awaiting
 * approval names the action per the dictionary contract; in-flight states
 * read as in progress; terminal states read as done.
 */
const headerTemplate = computed<{ template: string; placeholder: string }>(
  () => {
    if (status.value === 'awaiting-approval') {
      return { template: copy.approval.runAction, placeholder: 'action' }
    }
    if (isTerminal.value) {
      return { template: copy.status.called, placeholder: 'tool' }
    }
    return { template: copy.status.calling, placeholder: 'tool' }
  },
)

/**
 * Split a copy template around its placeholder so the tool name can render
 * in its own monospace element while the surrounding words stay translatable.
 */
const splitAroundPlaceholder = (
  template: string,
  placeholder: string,
): { before: string; after: string } => {
  const token = `{${placeholder}}`
  const index = template.indexOf(token)
  if (index === -1) {
    return { before: template, after: '' }
  }
  return {
    before: template.slice(0, index),
    after: template.slice(index + token.length),
  }
}

const headerParts = computed(() =>
  splitAroundPlaceholder(
    headerTemplate.value.template,
    headerTemplate.value.placeholder,
  ),
)

const headerTitle = computed<string>(() =>
  formatChatCopy(headerTemplate.value.template, {
    [headerTemplate.value.placeholder]: toolName.value,
  }),
)

const safeStringify = (value: unknown): string => {
  try {
    // `JSON.stringify` returns undefined for undefined input and throws on
    // circular structures; both fall back to a plain string rendering.
    return JSON.stringify(value, null, 2) ?? String(value)
  } catch {
    return String(value)
  }
}

const hasInput = computed<boolean>(() => {
  const value = description.value.input
  if (value === undefined || value === null) {
    return false
  }
  if (
    typeof value === 'object' &&
    !Array.isArray(value) &&
    Object.keys(value as Record<string, unknown>).length === 0
  ) {
    return false
  }
  return true
})

const formattedInput = computed<string>(() =>
  hasInput.value ? safeStringify(description.value.input) : '',
)

const formattedOutput = computed<string>(() => {
  const { output } = description.value
  if (output === undefined || output === null) {
    return ''
  }
  return safeStringify(output)
})

const errorText = computed<string>(() => description.value.errorText ?? '')

/**
 * Reduce an arbitrary output to a single preview string. MCP-shaped results
 * surface their first text content because that is what the user asked for;
 * everything else renders as compact JSON — data only, so no English leaks
 * past the copy dictionary.
 */
const summarizeOutput = (value: unknown): string => {
  if (value === undefined || value === null) {
    return ''
  }
  if (typeof value === 'string') {
    return value
  }
  if (typeof value === 'object' && !Array.isArray(value)) {
    const record = value as Record<string, unknown>
    if (Array.isArray(record.content)) {
      const first = record.content[0] as { text?: unknown } | undefined
      if (first && typeof first.text === 'string') {
        return first.text
      }
    }
    if ('structuredContent' in record) {
      return summarizeOutput(record.structuredContent)
    }
  }
  try {
    return JSON.stringify(value) ?? String(value)
  } catch {
    return String(value)
  }
}

/**
 * The visual clamp is CSS (design ruling A11); this slice only guards the
 * DOM against megabyte-sized outputs that would never be visible anyway.
 */
const PREVIEW_SLICE_LIMIT = 300

const guardPreviewSize = (value: string): string => {
  const trimmed = value.trim()
  return trimmed.length > PREVIEW_SLICE_LIMIT
    ? `${trimmed.slice(0, PREVIEW_SLICE_LIMIT)}…`
    : trimmed
}

const preview = computed<string>(() => {
  if (!isTerminal.value) {
    return ''
  }
  if (status.value === 'failed' || status.value === 'rejected') {
    return guardPreviewSize(errorText.value)
  }
  return guardPreviewSize(summarizeOutput(description.value.output))
})
</script>

<template>
  <article
    class="chat-tool-fallback-card"
    :class="`chat-tool-fallback-card--${status}`">
    <button
      :aria-expanded="expanded"
      class="chat-tool-fallback-card-header"
      :title="headerTitle"
      type="button"
      @click="expanded = !expanded">
      <span class="chat-tool-fallback-card-icon">
        <ScalarIconWrench weight="bold" />
      </span>
      <!--
        The three segments sit in their own elements so template whitespace
        between them is removed by the compiler and the copy string alone
        controls spacing around the monospace tool name.
      -->
      <span class="chat-tool-fallback-card-title">
        <span>{{ headerParts.before }}</span>
        <span class="chat-tool-fallback-card-name">{{ toolName }}</span>
        <span v-if="headerParts.after">{{ headerParts.after }}</span>
      </span>
      <span
        v-if="isTerminal"
        class="chat-tool-fallback-card-status"
        :title="description.state">
        <ScalarIconCheck
          v-if="status === 'complete'"
          class="chat-tool-fallback-card-status-icon"
          weight="bold" />
        <ScalarIconWarning
          v-else
          class="chat-tool-fallback-card-status-icon"
          weight="bold" />
        <template v-if="status === 'failed'">{{
          copy.status.requestFailed
        }}</template>
      </span>
      <span
        aria-hidden="true"
        class="chat-tool-fallback-card-caret"
        :class="{ 'chat-tool-fallback-card-caret--open': expanded }">
        <ScalarIconCaretDown weight="bold" />
      </span>
    </button>

    <p
      v-if="preview && !expanded"
      class="chat-tool-fallback-card-preview"
      :title="preview">
      {{ preview }}
    </p>

    <div
      v-if="expanded"
      class="chat-tool-fallback-card-body">
      <div
        v-if="hasInput"
        class="chat-tool-fallback-card-section">
        <span class="chat-tool-fallback-card-section-label">{{
          copy.tool.arguments
        }}</span>
        <ScalarCodeBlock
          class="chat-tool-fallback-card-code"
          :content="formattedInput"
          lang="json" />
      </div>

      <div
        v-if="errorText"
        class="chat-tool-fallback-card-section">
        <span class="chat-tool-fallback-card-section-label">{{
          copy.tool.error
        }}</span>
        <pre class="chat-tool-fallback-card-error">{{ errorText }}</pre>
      </div>

      <div
        v-else-if="isTerminal && formattedOutput"
        class="chat-tool-fallback-card-section">
        <span class="chat-tool-fallback-card-section-label">{{
          copy.tool.result
        }}</span>
        <ScalarCodeBlock
          class="chat-tool-fallback-card-code"
          :content="formattedOutput"
          lang="json" />
      </div>
    </div>
  </article>
</template>

<style scoped>
.chat-tool-fallback-card {
  border: var(--scalar-border-width) solid var(--scalar-border-color);
  border-radius: var(--scalar-radius-xl);
  background: var(--scalar-background-1);
  overflow: hidden;
}

.chat-tool-fallback-card--complete {
  border-color: color-mix(
    in oklch,
    var(--scalar-color-green) 30%,
    var(--scalar-border-color)
  );
}

.chat-tool-fallback-card--failed,
.chat-tool-fallback-card--rejected {
  border-color: color-mix(
    in oklch,
    var(--scalar-color-red) 30%,
    var(--scalar-border-color)
  );
}

/* Row typography and height come from the chat density variables set by ChatRoot. */
.chat-tool-fallback-card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 10px;
  min-height: var(--chat-row-min-h, 34px);
  border: none;
  background: transparent;
  cursor: pointer;
  text-align: left;
  font: inherit;
  font-size: var(--chat-font-row, var(--scalar-font-size-3));
  color: inherit;
}

.chat-tool-fallback-card-header:hover {
  background: var(--scalar-background-2);
}

.chat-tool-fallback-card-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--scalar-color-3);
  flex-shrink: 0;
}

.chat-tool-fallback-card-icon :deep(svg) {
  width: 16px;
  height: 16px;
}

.chat-tool-fallback-card-title {
  flex: 1;
  min-width: 0;
  color: var(--scalar-color-3);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chat-tool-fallback-card-name {
  font-family: var(--scalar-font-code);
  color: var(--scalar-color-1);
  font-weight: var(--scalar-semibold);
}

.chat-tool-fallback-card-status {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: var(--chat-font-meta, var(--scalar-font-size-4));
  color: var(--scalar-color-3);
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
}

.chat-tool-fallback-card--complete .chat-tool-fallback-card-status {
  color: var(--scalar-color-green);
}

.chat-tool-fallback-card--failed .chat-tool-fallback-card-status,
.chat-tool-fallback-card--rejected .chat-tool-fallback-card-status {
  color: var(--scalar-color-red);
}

.chat-tool-fallback-card-status-icon {
  width: 12px;
  height: 12px;
}

.chat-tool-fallback-card-caret {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--scalar-color-3);
  transition: transform 150ms ease;
}

.chat-tool-fallback-card-caret--open {
  transform: rotate(180deg);
}

.chat-tool-fallback-card-caret :deep(svg) {
  width: 12px;
  height: 12px;
}

/* The one-line condensed preview is a CSS clamp per design ruling A11. */
.chat-tool-fallback-card-preview {
  margin: 0;
  padding: 0 10px 8px;
  font-size: var(--chat-font-meta, var(--scalar-font-size-4));
  color: var(--scalar-color-3);
  line-height: 1.45;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chat-tool-fallback-card-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 10px;
  border-top: var(--scalar-border-width) solid var(--scalar-border-color);
  background: var(--scalar-background-2);
}

.chat-tool-fallback-card-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.chat-tool-fallback-card-section-label {
  font-size: var(--chat-font-row, var(--scalar-font-size-3));
  color: var(--scalar-color-3);
}

.chat-tool-fallback-card-code {
  border-radius: var(--scalar-radius-lg);
  overflow: hidden;
  font-size: var(--chat-font-meta, var(--scalar-font-size-4));
}

.chat-tool-fallback-card-error {
  margin: 0;
  padding: 8px 10px;
  font-family: var(--scalar-font-code);
  font-size: var(--chat-font-meta, var(--scalar-font-size-4));
  color: var(--scalar-color-red);
  background: var(--scalar-background-1);
  border-radius: var(--scalar-radius-lg);
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
