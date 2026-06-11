<script lang="ts">
export default {
  name: 'ConnectionPanel',
}
</script>

<script setup lang="ts">
import { computed } from 'vue'

import ViewLayoutSection from '@/components/ViewLayout/ViewLayoutSection.vue'
import type {
  WebSocketConnectionLogEntry,
  WebSocketFrame,
  WebSocketSessionState,
} from '@/v2/blocks/channel-operation-block/helpers/websocket-session'

import MessageLog from './MessageLog.vue'

const { sessionState, frames, connectionLogEntries } = defineProps<{
  /** WebSocket session state */
  sessionState: WebSocketSessionState
  /** Message frames */
  frames: WebSocketFrame[]
  /** Connection lifecycle entries */
  connectionLogEntries: WebSocketConnectionLogEntry[]
}>()
const emit = defineEmits<{
  (e: 'clear:messages'): void
}>()

const stateLabel = computed(() => {
  switch (sessionState) {
    case 'connecting':
      return 'Connecting'
    case 'open':
      return 'Connected'
    case 'closing':
      return 'Closing'
    case 'closed':
      return 'Disconnected'
    case 'error':
      return 'Error'
    default:
      return 'Idle'
  }
})

const stateColorClass = computed(() => {
  switch (sessionState) {
    case 'open':
      return 'bg-[var(--scalar-color-green)]'
    case 'connecting':
    case 'closing':
      return 'bg-[var(--scalar-color-yellow)]'
    case 'error':
      return 'bg-[var(--scalar-color-red)]'
    default:
      return 'bg-[var(--scalar-color-3)]'
  }
})
</script>

<template>
  <ViewLayoutSection aria-label="Connection">
    <template #title>
      <div class="text-c-1 flex items-center gap-2">
        <span
          class="block h-2 w-2 rounded-full"
          :class="stateColorClass" />
        <span>{{ stateLabel }}</span>
        <span
          v-if="frames.length"
          class="text-c-3 text-sm">
          · {{ frames.length }}
          {{ frames.length === 1 ? 'message' : 'messages' }}
        </span>
      </div>
    </template>

    <div class="relative flex min-h-0 flex-1 flex-col">
      <MessageLog
        :connectionLogEntries="connectionLogEntries"
        :frames="frames"
        :sessionState="sessionState"
        @clear="emit('clear:messages')" />
    </div>
  </ViewLayoutSection>
</template>
