<script lang="ts">
/**
 * Read-only list of AsyncAPI operations on the active channel (spec reference, not navigation).
 */
export default {
  name: 'ChannelOperationsReference',
}
</script>

<script setup lang="ts">
import type { ChannelOperationSummary } from '@scalar/workspace-store/channel-example'

import ChannelActionBadge from './ChannelActionBadge.vue'

const { operations } = defineProps<{
  operations: ChannelOperationSummary[]
}>()
</script>

<template>
  <ul
    v-if="operations.length"
    class="divide-y divide-dashed first:pt-0">
    <li
      v-for="{ operationName, operation, action } in operations"
      :key="operationName"
      class="flex gap-2.5 py-2 first:pt-0 last:pb-0">
      <ChannelActionBadge
        :action="action"
        variant="inline" />
      <div class="min-w-0 flex flex-1 flex-col gap-0.5">
        <span class="text-c-2 text-sm leading-snug font-medium">
          {{ operation.title ?? operationName }}
        </span>
        <span
          v-if="operation.summary ?? operation.description"
          class="text-c-3 text-xs leading-snug">
          {{ operation.summary ?? operation.description }}
        </span>
      </div>
    </li>
  </ul>
</template>
