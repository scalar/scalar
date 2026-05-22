<script lang="ts">
export default {
  name: 'ConnectionPanel',
}
</script>

<script setup lang="ts">
import { computed, ref, useId } from 'vue'

import SectionFilter from '@/components/SectionFilter.vue'
import ViewLayoutSection from '@/components/ViewLayout/ViewLayoutSection.vue'
import type {
  WebSocketCloseInfo,
  WebSocketFrame,
  WebSocketSessionState,
} from '@/v2/blocks/channel-operation-block/helpers/websocket-session'

import MessageLog from './MessageLog.vue'

const { sessionState, frames, closeInfo } = defineProps<{
  /** WebSocket session state */
  sessionState: WebSocketSessionState
  /** Message frames */
  frames: WebSocketFrame[]
  /** Close event details when disconnected */
  closeInfo: WebSocketCloseInfo | null
}>()
const emit = defineEmits<{
  (e: 'clear:messages'): void
}>()
const CONNECTION_SECTIONS = ['Messages', 'Info'] as const
type Filter = 'All' | (typeof CONNECTION_SECTIONS)[number]

const selectedFilter = ref<Filter>('All')
const filters = computed<Filter[]>(() => ['All', ...CONNECTION_SECTIONS])
const filterIds = computed(
  () =>
    Object.fromEntries(
      filters.value.map((section) => [section, useId()]),
    ) as Record<Filter, string>,
)

const isSectionVisible = (section: Filter): boolean =>
  selectedFilter.value === 'All' || selectedFilter.value === section

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
      <SectionFilter
        v-model="selectedFilter"
        :filterIds="filterIds"
        :filters="filters" />
    </template>

    <div
      :id="filterIds.All"
      class="custom-scroll relative flex min-h-0 flex-1 flex-col"
      :role="selectedFilter === 'All' ? 'tabpanel' : 'none'">
      <MessageLog
        v-show="isSectionVisible('Messages')"
        :id="filterIds.Messages"
        :frames="frames"
        @clear="emit('clear:messages')" />

      <div
        v-show="isSectionVisible('Info')"
        :id="filterIds.Info"
        class="text-c-2 flex flex-col gap-3 p-4 text-sm">
        <p>
          Browser WebSocket handshakes cannot set arbitrary HTTP headers. Apply
          authentication via query parameters from the spec, or use the Auth tab
          where supported.
        </p>
        <p>
          WebSocket connections go directly to the target host; the HTTP proxy
          is not used.
        </p>
        <dl
          v-if="closeInfo"
          class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
          <dt class="text-c-3">Close code</dt>
          <dd>{{ closeInfo.code }}</dd>
          <dt class="text-c-3">Reason</dt>
          <dd>{{ closeInfo.reason || '—' }}</dd>
          <dt class="text-c-3">Clean</dt>
          <dd>{{ closeInfo.wasClean ? 'Yes' : 'No' }}</dd>
        </dl>
      </div>
    </div>
  </ViewLayoutSection>
</template>
