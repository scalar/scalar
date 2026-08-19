<script setup lang="ts">
import type { ToolCardStatus } from '@scalar/chat-protocol'
import { ScalarLoading, useLoadingState } from '@scalar/components/loading'
import {
  ScalarIconCheck,
  ScalarIconInfo,
  ScalarIconWarning,
} from '@scalar/icons'
import { computed, watch } from 'vue'

/**
 * The one status badge of the chat kit.
 *
 * It replaces the per-status badge clones of agent-chat (RequestSuccess,
 * RequestFailed, SendingRequest, and friends) with a single component driven
 * by the canonical `ToolCardStatus` machine. The badge renders state only:
 * the caller assembles `label` from the copy dictionary (`useChatCopy()` +
 * `formatChatCopy()`) so grammar and localization stay out of the primitive.
 */
const { status, label } = defineProps<{
  /** Canonical tool-card status; picks the icon and the color tone. */
  status: ToolCardStatus
  /** Caller-assembled copy (already localized and formatted); rendered verbatim. */
  label: string
}>()

/**
 * The color tone of the badge. Activity uses accent TEXT color only — the
 * design review's accent budget reserves accent fills for the composer, so
 * the badge never paints an accent background.
 */
type ChatStatusTone = 'accent' | 'neutral' | 'danger'

/** Statuses that show the spinner because work is still in flight. */
const loadingStatuses = new Set<ToolCardStatus>([
  'pending',
  'running',
  'applying',
])

const isLoading = computed<boolean>(() => loadingStatuses.has(status))

const loader = useLoadingState()

// The loader is a stateful machine, not a prop: it must be started while the
// badge sits in a loading status and stopped once the status settles, so a
// badge that re-enters a loading status spins again.
watch(
  isLoading,
  (loading: boolean): void => {
    if (loading) {
      loader.start()
    } else {
      void loader.clear({ duration: 0 })
    }
  },
  { immediate: true },
)

const tone = computed<ChatStatusTone>(() => {
  switch (status) {
    case 'pending':
    case 'running':
    case 'applying':
    case 'awaiting-approval':
      return 'accent'
    case 'complete':
      return 'neutral'
    case 'failed':
    case 'rejected':
      return 'danger'
  }
})
</script>

<template>
  <div
    class="chat-status-badge"
    :class="`chat-status-badge--${tone}`">
    <!-- The icon is decorative: the label alone carries the meaning. -->
    <span
      aria-hidden="true"
      class="chat-status-badge-icon">
      <slot name="icon">
        <ScalarLoading
          v-if="isLoading"
          :loader="loader" />
        <ScalarIconInfo
          v-else-if="status === 'awaiting-approval'"
          weight="bold" />
        <ScalarIconCheck
          v-else-if="status === 'complete'"
          weight="bold" />
        <ScalarIconWarning
          v-else
          weight="bold" />
      </slot>
    </span>
    {{ label }}
  </div>
</template>

<style scoped>
.chat-status-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  min-height: var(--chat-row-min-h);
  font-size: var(--chat-font-row);
  font-weight: var(--scalar-semibold);
  position: relative;
}
.chat-status-badge--accent {
  color: var(--scalar-color-blue);
}
.chat-status-badge--neutral {
  color: var(--scalar-color-1);
}
.chat-status-badge--danger {
  color: var(--scalar-color-red);
}
/*
 * The icon box is a fixed 16px regardless of density: the design direction
 * keeps icon sizing constant while the density variables scale text and row
 * height (see density.ts).
 */
.chat-status-badge-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}
/* Icons size themselves in em units; pin them to the 16px box instead. */
.chat-status-badge-icon > :deep(svg) {
  width: 100%;
  height: 100%;
}
/* The loader wrapper sizes itself with utility classes the kit does not ship. */
.chat-status-badge-icon :deep(.loader-wrapper) {
  width: 100%;
  height: 100%;
}
</style>
