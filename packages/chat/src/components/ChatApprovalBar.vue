<script setup lang="ts">
import { computed } from 'vue'

import { formatChatCopy, useChatCopy } from '@/copy/copy'

/**
 * The composer-docked approval bar (rulings A9/A14).
 *
 * One bar aggregates every pending decision: a single approval names the
 * action it would run, multiple collapse into a count. It mounts in the
 * composer's `banners` slot so Tab reaches Reject → Approve from the
 * textarea, and it never renders while nothing is pending.
 */
const { approvals } = defineProps<{
  approvals: {
    toolCallId: string
    toolName: string
    /** Human-readable action, e.g. `POST /planets`; falls back to the tool name. */
    action?: string
    destructive?: boolean
  }[]
}>()

const emit = defineEmits<{
  approve: []
  reject: []
}>()

const copy = useChatCopy()

const single = computed(() =>
  approvals.length === 1 ? approvals[0] : undefined,
)

/** Any destructive decision makes the whole bar destructive — approving all includes it. */
const destructive = computed<boolean>(() =>
  approvals.some((approval) => approval.destructive === true),
)

const label = computed<string>(() => {
  const one = single.value

  if (one) {
    return formatChatCopy(copy.approval.runAction, {
      action: one.action ?? one.toolName,
    })
  }

  return formatChatCopy(copy.approval.approveMany, {
    count: approvals.length,
  })
})

/**
 * A destructive single approval echoes the action on the button itself, so
 * the click reads exactly what it is about to run.
 */
const approveLabel = computed<string>(() => {
  const one = single.value

  if (destructive.value && one) {
    return one.action ?? one.toolName
  }

  return copy.approval.approve
})
</script>

<template>
  <div
    v-if="approvals.length > 0"
    class="chat-approval-bar"
    :class="{ 'chat-approval-bar-destructive': destructive }">
    <span class="chat-approval-bar-label">{{ label }}</span>
    <div class="chat-approval-bar-actions">
      <button
        type="button"
        class="chat-approval-bar-reject"
        @click="emit('reject')">
        {{ copy.approval.reject }}
      </button>
      <button
        type="button"
        class="chat-approval-bar-approve"
        @click="emit('approve')">
        {{ approveLabel }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.chat-approval-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: var(--chat-row-min-h);
  padding: 6px 8px 6px 12px;
  background: var(--scalar-background-2);
  border: 1px solid var(--scalar-border-color);
  border-radius: var(--scalar-radius-lg);
  font-size: var(--chat-font-row);
  color: var(--scalar-color-1);
}

.chat-approval-bar-label {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chat-approval-bar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.chat-approval-bar-reject,
.chat-approval-bar-approve {
  /* The 28px control height is constant across densities. */
  height: 28px;
  padding: 0 12px;
  /* Borderless full pills, per the design review. */
  border: none;
  border-radius: var(--scalar-radius-full);
  font-family: var(--scalar-font);
  font-size: var(--chat-font-row);
  cursor: pointer;
}

.chat-approval-bar-reject {
  background: transparent;
  color: var(--scalar-color-2);
}

.chat-approval-bar-reject:hover {
  background: color-mix(in srgb, var(--scalar-color-1) 8%, transparent);
  color: var(--scalar-color-1);
}

.chat-approval-bar-approve {
  background: var(--scalar-color-blue);
  /* Same pairing ruling as the send glyph: --scalar-background-1, never white. */
  color: var(--scalar-background-1);
}

/* A destructive decision anywhere in the set turns Approve red-filled. */
.chat-approval-bar-destructive .chat-approval-bar-approve {
  background: var(--scalar-color-red);
}

.chat-approval-bar-reject:focus-visible,
.chat-approval-bar-approve:focus-visible {
  outline: 1px solid var(--scalar-color-blue);
  outline-offset: 1px;
}
</style>
