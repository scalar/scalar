<script lang="ts">
export default {
  name: 'MessageLog',
}
</script>

<script setup lang="ts">
import { ScalarButton } from '@scalar/components/button'
import { ScalarIconArrowUp } from '@scalar/icons'
import { computed, ref } from 'vue'

import { formatFrameData } from '@/v2/blocks/channel-operation-block/helpers/format-frame-data'
import type {
  WebSocketConnectionLogEntry,
  WebSocketFrame,
} from '@/v2/blocks/channel-operation-block/helpers/websocket-session'

const { frames, connectionLogEntries } = defineProps<{
  /** Chronological WebSocket frames */
  frames: WebSocketFrame[]
  /** Connection lifecycle entries */
  connectionLogEntries: WebSocketConnectionLogEntry[]
}>()

const emit = defineEmits<{
  (e: 'clear'): void
}>()

const MESSAGE_LOG_FILTERS = ['All', 'Input', 'Output'] as const

type MessageLogFilter = (typeof MESSAGE_LOG_FILTERS)[number]

const contentContainer = ref<HTMLElement | null>(null)
const showJumpToLatest = ref(false)
const selectedFilter = ref<MessageLogFilter>('All')

type WebSocketMessageLogEntry = WebSocketFrame & {
  type: 'message'
}

type WebSocketLogEntry = WebSocketMessageLogEntry | WebSocketConnectionLogEntry

const logEntries = computed<WebSocketLogEntry[]>(() =>
  [
    ...frames.map((frame) => ({
      ...frame,
      type: 'message' as const,
    })),
    ...connectionLogEntries,
  ].sort((a, b) => a.timestamp - b.timestamp),
)

const visibleLogEntries = computed(() => {
  if (selectedFilter.value === 'Input') {
    return logEntries.value.filter(
      (entry) => entry.type === 'message' && entry.direction === 'incoming',
    )
  }

  if (selectedFilter.value === 'Output') {
    return logEntries.value.filter(
      (entry) => entry.type === 'message' && entry.direction === 'outgoing',
    )
  }

  return logEntries.value
})

const formattedLogEntries = computed(() =>
  [...visibleLogEntries.value].reverse().map((entry) => ({
    ...entry,
    formatted:
      entry.type === 'message'
        ? formatFrameData(entry.data)
        : [entry.message, entry.detail].filter(Boolean).join('\n'),
    time: new Date(entry.timestamp).toLocaleTimeString(),
  })),
)

const hasLogEntries = computed(() => logEntries.value.length > 0)

const emptyFilterMessage = computed(
  () => `No ${selectedFilter.value.toLowerCase()} messages`,
)

const jumpToTop = (): void => {
  if (contentContainer.value) {
    contentContainer.value.scrollTop = 0
  }
  showJumpToLatest.value = false
}

const handleScroll = (event: Event): void => {
  const target = event.currentTarget
  if (!(target instanceof HTMLElement)) {
    return
  }

  showJumpToLatest.value = target.scrollTop > 48
}

const handleSelectFilter = (filter: MessageLogFilter): void => {
  selectedFilter.value = filter
}
</script>

<template>
  <div class="relative flex min-h-0 flex-1 flex-col">
    <div
      v-if="!hasLogEntries"
      class="text-c-3 flex flex-1 items-center justify-center p-4 text-sm">
      Connect to start receiving messages
    </div>
    <ScalarButton
      v-if="hasLogEntries && showJumpToLatest"
      class="absolute top-3 left-1/2 z-10 -translate-x-1/2 rounded-full shadow-lg"
      size="sm"
      variant="outlined"
      @click="jumpToTop">
      <template #icon>
        <ScalarIconArrowUp class="size-full" />
      </template>
      Jump to latest
    </ScalarButton>
    <div
      v-if="hasLogEntries"
      ref="contentContainer"
      class="custom-scroll flex flex-1 flex-col gap-2 overflow-y-auto p-3"
      @scroll="handleScroll">
      <div
        v-if="formattedLogEntries.length === 0"
        class="text-c-3 flex flex-1 items-center justify-center p-4 text-sm">
        {{ emptyFilterMessage }}
      </div>
      <div
        v-for="(entry, index) in formattedLogEntries"
        :key="`${entry.timestamp}-${index}`"
        class="flex flex-col gap-1">
        <div
          v-if="entry.type === 'connection'"
          class="text-c-3 flex items-center gap-2 text-xs">
          <span
            class="font-code rounded px-1.5 py-0.5 font-bold"
            :class="
              entry.status === 'connected'
                ? 'bg-[var(--scalar-color-green)]/20 text-[var(--scalar-color-green)]'
                : entry.status === 'error'
                  ? 'bg-[var(--scalar-color-red)]/20 text-[var(--scalar-color-red)]'
                  : 'bg-b-2 text-c-2'
            ">
            {{ entry.status.toUpperCase() }}
          </span>
          <span>{{ entry.time }}</span>
        </div>
        <div
          v-else
          class="text-c-3 flex items-center gap-2 text-xs">
          <span
            class="font-code rounded px-1.5 py-0.5 font-bold"
            :class="
              entry.direction === 'incoming'
                ? 'bg-[var(--scalar-color-blue)]/20 text-[var(--scalar-color-blue)]'
                : 'bg-[var(--scalar-color-green)]/20 text-[var(--scalar-color-green)]'
            ">
            {{ entry.direction === 'incoming' ? 'IN' : 'OUT' }}
          </span>
          <span>{{ entry.time }}</span>
          <span
            v-if="entry.opcode === 'binary'"
            class="text-c-3">
            binary
          </span>
        </div>
        <pre
          class="text-c-1 bg-b-2 overflow-x-auto rounded p-2 font-mono text-xs leading-relaxed whitespace-pre-wrap">{{ entry.formatted }}</pre>
      </div>
    </div>
    <div
      v-if="hasLogEntries"
      class="flex items-center justify-between gap-2 border-t p-2">
      <div
        aria-label="Message direction filter"
        class="flex items-center gap-1"
        role="group">
        <button
          v-for="filter in MESSAGE_LOG_FILTERS"
          :key="filter"
          :aria-pressed="selectedFilter === filter"
          class="hover:bg-b-2 flex w-fit cursor-pointer items-center rounded p-1 px-2 text-center text-xs font-medium whitespace-nowrap has-[:focus-visible]:outline"
          :class="{
            'text-c-1 bg-b-2 pointer-events-none': selectedFilter === filter,
          }"
          type="button"
          @click="handleSelectFilter(filter)">
          {{ filter }}
        </button>
      </div>
      <ScalarButton
        size="sm"
        variant="outlined"
        @click="emit('clear')">
        Clear log
      </ScalarButton>
    </div>
  </div>
</template>
