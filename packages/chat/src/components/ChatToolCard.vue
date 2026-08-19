<script setup lang="ts">
import type { ToolCardStatus } from '@scalar/chat-protocol'
import { ScalarLoading, useLoadingState } from '@scalar/components/loading'
import { ScalarIconWarningCircle } from '@scalar/icons'
import { computed, watch, type Component, type FunctionalComponent } from 'vue'

/**
 * The keystone tool-card shell every tool renderer composes.
 *
 * Ported from the editor's `EditorAgentToolCard` per the unification plan
 * (redline E5) — the shell stays close to verbatim so the migrated surfaces
 * keep their look. Status comes from the canonical `ToolCardStatus` machine:
 * `pending`, `running` and `applying` drive the loading spinner,
 * `awaiting-approval` deliberately does not spin (the card waits on the user,
 * not on work), `failed` and `rejected` show the issue icon, and `complete`
 * is the resting state.
 *
 * Notice slot contract: content rendered into the `notice` slot styles itself
 * with three deep classes the shell provides —
 * `chat-tool-card-notice` (a single notice line),
 * `chat-tool-card-notice-list` (a stacked list of notice lines) and
 * `chat-tool-card-notice-more` (the muted "and more" overflow line).
 *
 * Actions slot: decision controls (Approve / Reject / Apply) are banned here —
 * decisions render only in the composer-docked approval bar (design rule A14).
 * The slot carries non-decision utilities such as copy or view file.
 */
// `hasBody` defaults to undefined explicitly: without a declared default,
// Vue casts an absent boolean prop to false, which would defeat the
// `hasBody ?? !!$slots.default` auto-detection below.
const {
  verb,
  path,
  status,
  icon,
  compact,
  hasIssue,
  hasBody = undefined,
} = defineProps<{
  /** The lowercased action word leading the row, e.g. `write` or `search`. */
  verb: string
  /** Optional file path shown after the verb, shortened when long. */
  path?: string
  /** The canonical card status from `@scalar/chat-protocol`. */
  status: ToolCardStatus
  /** Leading glyph shown while the card is neither loading nor in an issue state. */
  icon?: Component | FunctionalComponent
  /** Tightens the header row for dense stacks of cards. */
  compact?: boolean
  /** Forces the issue icon for problems the status alone does not carry. */
  hasIssue?: boolean
  /** Overrides body detection when a default slot exists but should stay hidden. */
  hasBody?: boolean
}>()

const basename = (value: string): string => {
  const idx = value.lastIndexOf('/')
  return idx >= 0 ? value.slice(idx + 1) : value
}

const shorten = (value: string): string => {
  if (!value) {
    return ''
  }
  if (value.length <= 42) {
    return value
  }
  return `…/${basename(value)}`
}

const displayPath = computed(() => shorten(path ?? ''))

const isLoading = computed(
  () => status === 'pending' || status === 'running' || status === 'applying',
)

const showIssue = computed(
  () => hasIssue || status === 'failed' || status === 'rejected',
)

const loader = useLoadingState()

watch(
  isLoading,
  (loading) => {
    if (loading) {
      loader.start()
      return
    }
    void loader.clear({ duration: 0 })
  },
  { immediate: true },
)
</script>

<template>
  <article
    class="chat-tool-card"
    :class="[
      `chat-tool-card--${status}`,
      {
        'chat-tool-card--compact': compact,
        'chat-tool-card--has-notice': $slots.notice,
        'chat-tool-card--has-body': hasBody ?? !!$slots.default,
      },
    ]">
    <header class="chat-tool-card-header">
      <div class="chat-tool-card-lead">
        <span class="chat-tool-card-icon-slot">
          <ScalarLoading
            v-if="isLoading"
            class="chat-tool-card-loader"
            :loader="loader"
            size="md" />
          <ScalarIconWarningCircle
            v-else-if="showIssue"
            class="chat-tool-card-icon chat-tool-card-icon--issue"
            weight="bold" />
          <component
            :is="icon"
            v-else-if="icon"
            class="chat-tool-card-icon"
            weight="bold" />
        </span>
        <span class="chat-tool-card-verb">{{ verb }}</span>
        <span
          v-if="path"
          class="chat-tool-card-path"
          :title="path">
          {{ displayPath }}
        </span>
      </div>
      <div
        v-if="$slots.stats"
        class="chat-tool-card-trail">
        <slot name="stats" />
      </div>
    </header>
    <div
      v-if="$slots.notice"
      class="chat-tool-card-notices">
      <slot name="notice" />
    </div>
    <div
      v-if="(hasBody ?? !!$slots.default) && $slots.default"
      class="chat-tool-card-body">
      <slot />
    </div>
    <footer
      v-if="$slots.actions"
      class="chat-tool-card-actions">
      <slot name="actions" />
    </footer>
  </article>
</template>

<style scoped>
.chat-tool-card {
  display: flex;
  flex-direction: column;
  background: var(--scalar-background-1);
  border: var(--scalar-border-width) solid var(--scalar-border-color);
  border-radius: var(--scalar-radius-md);
  overflow: hidden;
  animation: chat-tool-card-in 180ms cubic-bezier(0.2, 0.8, 0.2, 1);
}

/* Row typography and height come from the chat density variables set by ChatRoot. */
.chat-tool-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 8px;
  min-height: var(--chat-row-min-h, 34px);
  font-size: var(--chat-font-row, var(--scalar-font-size-3));
  line-height: var(--scalar-line-height-3);
}

.chat-tool-card--has-body:not(.chat-tool-card--has-notice)
  .chat-tool-card-header {
  border-bottom: var(--scalar-border-width) solid var(--scalar-border-color);
}

.chat-tool-card--compact .chat-tool-card-header {
  padding: 8px;
  min-height: var(--chat-row-min-h, 32px);
}

.chat-tool-card-lead {
  display: flex;
  align-items: center;
  min-width: 0;
  flex: 1;
}

.chat-tool-card-icon-slot {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 27px;
  height: 16px;
  color: var(--scalar-color-3);
  flex-shrink: 0;
}

.chat-tool-card-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.chat-tool-card-loader {
  color: var(--scalar-color-3);
}

.chat-tool-card-icon--issue {
  color: var(--scalar-color-red);
}

.chat-tool-card-verb {
  font-size: inherit;
  font-weight: var(--scalar-semibold);
  color: var(--scalar-color-1);
  text-transform: lowercase;
  flex-shrink: 0;
}

.chat-tool-card-path {
  font-size: inherit;
  color: var(--scalar-color-1);
  margin-left: 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chat-tool-card-trail {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
  font-size: inherit;
  line-height: inherit;
}

.chat-tool-card-body {
  display: block;
}

.chat-tool-card-notices {
  padding: 0 8px 10px 36px;
  margin-top: -6px;
}

.chat-tool-card--has-body .chat-tool-card-notices {
  border-bottom: var(--scalar-border-width) solid var(--scalar-border-color);
}

.chat-tool-card-notices :deep(.chat-tool-card-notice) {
  display: block;
  margin: 0;
  color: var(--scalar-color-2);
  font-size: var(--scalar-font-size-3);
  line-height: var(--scalar-line-height-3);
}

.chat-tool-card-notices :deep(.chat-tool-card-notice-list) {
  display: flex;
  flex-direction: column;
  gap: 4px;
  list-style: none;
  margin: 0;
  padding: 0;
  color: var(--scalar-color-2);
  font-size: var(--scalar-font-size-3);
  line-height: var(--scalar-line-height-3);
}

.chat-tool-card-notices :deep(.chat-tool-card-notice-list li) {
  display: block;
}

.chat-tool-card-notices :deep(.chat-tool-card-notice-more) {
  color: var(--scalar-color-3);
  font-style: italic;
}

.chat-tool-card-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border-top: var(--scalar-border-width) solid var(--scalar-border-color);
}

@keyframes chat-tool-card-in {
  from {
    opacity: 0;
    transform: translateY(2px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
