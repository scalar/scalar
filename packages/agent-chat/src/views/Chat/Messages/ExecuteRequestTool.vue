<script setup lang="ts">
import { type ToolUIPart } from 'ai'
import { computed, type Ref } from 'vue'

import RequestPreview from '@/components/RequestPreview.vue'
import type { EXECUTE_REQUEST_TOOL_NAME } from '@/entities/tools/execute-request'
import { useState, type Tools } from '@/state/state'

const { messagePart } = defineProps<{
  messagePart: Ref<ToolUIPart<Pick<Tools, typeof EXECUTE_REQUEST_TOOL_NAME>>>
}>()

const state = useState()

const requestState = computed(() => {
  if (
    (messagePart.value.state === 'input-available' &&
      state.chat.status === 'streaming') ||
    (messagePart.value.state === 'approval-responded' &&
      state.chat.status === 'submitted')
  ) {
    return 'sendingRequest'
  }

  if (messagePart.value.state === 'approval-requested') {
    return 'requiresApproval'
  }

  if (messagePart.value.state === 'output-available') {
    return messagePart.value.output.isError
      ? 'requestFailed'
      : 'requestSucceeded'
  }

  if (messagePart.value.state === 'approval-responded') {
    return 'approved'
  }
  if (messagePart.value.state === 'output-denied') {
    return 'rejected'
  }

  return null
})
</script>

<template>
  <div class="executeRequestTool">
    <RequestPreview
      v-if="requestState"
      :request="messagePart.value.input"
      :response="messagePart.value.output"
      :state="requestState" />
  </div>
</template>

<style scoped>
.executeRequestTool {
  display: flex;
  flex-direction: column;
  gap: 10px;
  border-top: var(--scalar-border-width) solid var(--scalar-border-color);
  border-bottom: var(--scalar-border-width) solid var(--scalar-border-color);
  margin-bottom: 12px;
  /* ensures no overlapping border colors when there's two sibling execute request tools */
  box-shadow:
    0 var(--scalar-border-width) 0 var(--scalar-background-1),
    0 calc(-1 * var(--scalar-border-width)) 0 var(--scalar-background-1);
}
.tool {
  border: var(--scalar-border-width) solid var(--scalar-border-color);
  padding: 15px;
  border-radius: 15px;
  margin-bottom: 20px;
}
</style>
