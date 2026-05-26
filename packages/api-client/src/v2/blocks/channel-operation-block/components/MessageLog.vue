<script lang="ts">
export default {
  name: 'MessageLog',
}
</script>

<script setup lang="ts">
import { ScalarButton } from '@scalar/components/button'
import { ScalarCodeBlock } from '@scalar/components/code-block'
import {
  ScalarListbox,
  type ScalarListboxOption,
} from '@scalar/components/listbox'
import {
  ScalarIconArrowUp,
  ScalarIconCaretDown,
  ScalarIconMagnifyingGlass,
  ScalarIconTrash,
} from '@scalar/icons'
import { computed, ref } from 'vue'

import {
  formatFrameData,
  type WebSocketFrameDisplayFormat,
} from '@/v2/blocks/channel-operation-block/helpers/format-frame-data'
import type {
  WebSocketConnectionLogEntry,
  WebSocketFrame,
} from '@/v2/blocks/channel-operation-block/helpers/websocket-session'

type MessageLogFilter = 'all' | 'input' | 'output'

const { frames, connectionLogEntries } = defineProps<{
  /** Chronological WebSocket frames */
  frames: WebSocketFrame[]
  /** Connection lifecycle entries */
  connectionLogEntries: WebSocketConnectionLogEntry[]
}>()

const emit = defineEmits<{
  (e: 'clear'): void
}>()

const MESSAGE_LOG_FILTER_OPTIONS = [
  { id: 'all', label: 'All Messages' },
  { id: 'input', label: 'Input' },
  { id: 'output', label: 'Output' },
] satisfies ScalarListboxOption[]
const MESSAGE_DISPLAY_FORMAT_OPTIONS = [
  { id: 'text', label: 'Text' },
  { id: 'html', label: 'HTML' },
  { id: 'json', label: 'JSON' },
  { id: 'xml', label: 'XML' },
] satisfies ScalarListboxOption[]

const contentContainer = ref<HTMLElement | null>(null)
const expandedConnectionEntryIds = ref<Set<string>>(new Set())
const expandedMessageEntryIds = ref<Set<string>>(new Set())
const selectedMessageDisplayFormats = ref<
  Record<string, WebSocketFrameDisplayFormat>
>({})
const showJumpToLatest = ref(false)
const selectedFilter = ref<MessageLogFilter>('all')
const searchQuery = ref('')

type WebSocketMessageLogEntry = WebSocketFrame & {
  type: 'message'
}

type WebSocketLogEntry = WebSocketMessageLogEntry | WebSocketConnectionLogEntry
type FormattedWebSocketMessageLogEntry = WebSocketMessageLogEntry & {
  formatted: string
  time: string
}
type FormattedWebSocketConnectionLogEntry = WebSocketConnectionLogEntry & {
  formatted: string
  time: string
}
type FormattedWebSocketLogEntry =
  | FormattedWebSocketMessageLogEntry
  | FormattedWebSocketConnectionLogEntry

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
  if (selectedFilter.value === 'input') {
    return logEntries.value.filter(
      (entry) => entry.type === 'message' && entry.direction === 'incoming',
    )
  }

  if (selectedFilter.value === 'output') {
    return logEntries.value.filter(
      (entry) => entry.type === 'message' && entry.direction === 'outgoing',
    )
  }

  return logEntries.value
})

const getMessageEntryId = (entry: WebSocketMessageLogEntry): string =>
  `${entry.direction}-${entry.timestamp}-${entry.opcode}`

const getMessagePreview = (formatted: string): string => {
  const preview = formatted.replace(/\s+/g, ' ').trim()

  return preview.length > 96 ? `${preview.slice(0, 96)}…` : preview
}

const isMessageDisplayFormat = (
  value: ScalarListboxOption['id'] | undefined,
): value is WebSocketFrameDisplayFormat =>
  value === 'text' || value === 'html' || value === 'json' || value === 'xml'

const getMessageDisplayFormat = (
  entry: WebSocketMessageLogEntry,
): WebSocketFrameDisplayFormat =>
  selectedMessageDisplayFormats.value[getMessageEntryId(entry)] ?? 'json'

const getMessageDisplayFormatOption = (
  entry: WebSocketMessageLogEntry,
): ScalarListboxOption | undefined =>
  MESSAGE_DISPLAY_FORMAT_OPTIONS.find(
    ({ id }) => id === getMessageDisplayFormat(entry),
  )

const selectedFilterOption = computed(() =>
  MESSAGE_LOG_FILTER_OPTIONS.find(({ id }) => id === selectedFilter.value),
)

const getMessageHighlightLanguage = (
  entry: WebSocketMessageLogEntry,
): string => {
  const format = getMessageDisplayFormat(entry)

  return format === 'text' ? 'plaintext' : format
}

const handleSelectDisplayFormat = (
  entry: WebSocketMessageLogEntry,
  option: ScalarListboxOption | undefined,
): void => {
  if (!isMessageDisplayFormat(option?.id)) {
    return
  }

  selectedMessageDisplayFormats.value = {
    ...selectedMessageDisplayFormats.value,
    [getMessageEntryId(entry)]: option.id,
  }
}

const isMessageLogFilter = (
  value: ScalarListboxOption['id'] | undefined,
): value is MessageLogFilter =>
  value === 'all' || value === 'input' || value === 'output'

const handleSelectFilter = (option: ScalarListboxOption | undefined): void => {
  if (!isMessageLogFilter(option?.id)) {
    return
  }

  selectedFilter.value = option.id
}

const getSearchableLogEntryText = (
  entry: FormattedWebSocketLogEntry,
): string => {
  if (entry.type === 'message') {
    return [entry.direction, entry.opcode, entry.formatted, entry.time].join(
      '\n',
    )
  }

  return [
    entry.status,
    entry.message,
    entry.detail,
    entry.time,
    ...(entry.details ?? []).flatMap(({ label, value }) => [label, value]),
  ]
    .filter(Boolean)
    .join('\n')
}

const matchesSearchQuery = (entry: FormattedWebSocketLogEntry): boolean => {
  const query = searchQuery.value.trim().toLowerCase()

  if (!query) {
    return true
  }

  return getSearchableLogEntryText(entry).toLowerCase().includes(query)
}

const formattedLogEntries = computed(() =>
  [...visibleLogEntries.value]
    .reverse()
    .map((entry): FormattedWebSocketLogEntry => {
      if (entry.type === 'message') {
        return {
          ...entry,
          formatted: formatFrameData(
            entry.data,
            getMessageDisplayFormat(entry),
          ),
          time: new Date(entry.timestamp).toLocaleTimeString(),
        }
      }

      return {
        ...entry,
        formatted: entry.message,
        time: new Date(entry.timestamp).toLocaleTimeString(),
      }
    })
    .filter(matchesSearchQuery),
)

const hasLogEntries = computed(() => logEntries.value.length > 0)

const emptyFilterMessage = computed(() => {
  if (searchQuery.value.trim()) {
    return `No messages match "${searchQuery.value.trim()}"`
  }

  return selectedFilter.value === 'all'
    ? 'No messages'
    : `No ${selectedFilterOption.value?.label.toLowerCase()} messages`
})

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

const isConnectionEntryExpanded = (id: string): boolean =>
  expandedConnectionEntryIds.value.has(id)

const toggleConnectionEntry = (id: string): void => {
  const nextIds = new Set(expandedConnectionEntryIds.value)

  if (nextIds.has(id)) {
    nextIds.delete(id)
  } else {
    nextIds.add(id)
  }

  expandedConnectionEntryIds.value = nextIds
}

const isMessageEntryExpanded = (entry: WebSocketMessageLogEntry): boolean =>
  expandedMessageEntryIds.value.has(getMessageEntryId(entry))

const toggleMessageEntry = (entry: WebSocketMessageLogEntry): void => {
  const id = getMessageEntryId(entry)
  const nextIds = new Set(expandedMessageEntryIds.value)

  if (nextIds.has(id)) {
    nextIds.delete(id)
  } else {
    nextIds.add(id)
  }

  expandedMessageEntryIds.value = nextIds
}
</script>

<template>
  <div class="relative flex min-h-0 flex-1 flex-col">
    <div
      v-if="hasLogEntries"
      class="flex flex-wrap items-center gap-2 border-b p-2">
      <label
        class="bg-b-2 focus-within:border-c-3/40 focus-within:bg-b-1 flex h-7 w-56 max-w-full items-center gap-1.5 rounded border border-transparent px-2 text-xs transition-colors">
        <span class="sr-only">Search messages</span>
        <ScalarIconMagnifyingGlass class="text-c-3 size-3.5 shrink-0" />
        <input
          v-model="searchQuery"
          class="placeholder:text-c-3 text-c-1 min-w-0 flex-1 border-0 bg-transparent p-0 outline-none"
          placeholder="Search"
          spellcheck="false"
          type="search" />
      </label>
      <ScalarListbox
        :modelValue="selectedFilterOption"
        :options="MESSAGE_LOG_FILTER_OPTIONS"
        placement="bottom-start"
        teleport
        @update:modelValue="handleSelectFilter">
        <ScalarButton
          class="text-c-2 hover:text-c-1 flex gap-1.5 px-2 py-1 text-xs font-normal"
          size="sm"
          variant="ghost">
          {{ selectedFilterOption?.label ?? 'All Messages' }}
          <ScalarIconCaretDown
            class="ui-open:rotate-180 size-3 transition-transform duration-100"
            weight="bold" />
        </ScalarButton>
      </ScalarListbox>
      <div class="flex-1" />
      <ScalarButton
        class="text-c-2 hover:text-c-1 gap-1.5 px-2 py-1 text-xs font-normal"
        size="sm"
        variant="ghost"
        @click="emit('clear')">
        <template #icon>
          <ScalarIconTrash class="size-3.5" />
        </template>
        Clear Messages
      </ScalarButton>
    </div>
    <div
      v-if="!hasLogEntries"
      class="text-c-3 flex flex-1 items-center justify-center p-4 text-sm">
      Connect to start receiving messages
    </div>
    <ScalarButton
      v-if="hasLogEntries && showJumpToLatest"
      class="absolute top-14 left-1/2 z-10 -translate-x-1/2 rounded-full shadow-lg"
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
        <div v-if="entry.type === 'connection'">
          <button
            class="hover:bg-b-2 flex w-full cursor-pointer items-center gap-2 rounded p-2 text-left text-xs"
            type="button"
            @click="toggleConnectionEntry(entry.id)">
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
            <span class="text-c-1 min-w-0 flex-1 truncate">
              {{ entry.message }}
            </span>
            <span class="text-c-3">{{ entry.time }}</span>
            <ScalarIconCaretDown
              class="text-c-3 size-3 shrink-0 transition-transform"
              :class="{ 'rotate-180': isConnectionEntryExpanded(entry.id) }" />
          </button>
          <div
            v-if="isConnectionEntryExpanded(entry.id)"
            class="border-l-c-3/20 ml-5 flex flex-col gap-2 border-l pb-2 pl-3">
            <div class="text-c-3 text-xs font-medium">Handshake Details</div>
            <dl
              class="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1 text-xs">
              <template
                v-for="detail in entry.details ?? []"
                :key="detail.label">
                <dt class="text-c-3 whitespace-nowrap">{{ detail.label }}</dt>
                <dd class="text-c-1 font-code min-w-0 break-all">
                  {{ detail.value }}
                </dd>
              </template>
            </dl>
            <p
              v-if="entry.detail"
              class="text-c-2 font-code text-xs">
              {{ entry.detail }}
            </p>
          </div>
        </div>
        <div v-else>
          <button
            class="hover:bg-b-2 flex w-full cursor-pointer items-center gap-2 rounded p-2 text-left text-xs"
            type="button"
            @click="toggleMessageEntry(entry)">
            <span
              class="font-code min-w-8 rounded px-1.5 py-0.5 text-center font-bold"
              :class="
                entry.direction === 'incoming'
                  ? 'bg-[var(--scalar-color-blue)]/20 text-[var(--scalar-color-blue)]'
                  : 'bg-[var(--scalar-color-green)]/20 text-[var(--scalar-color-green)]'
              ">
              {{ entry.direction === 'incoming' ? 'IN' : 'OUT' }}
            </span>
            <span
              v-if="entry.opcode === 'binary'"
              class="text-c-3">
              binary
            </span>
            <span class="text-c-1 font-code min-w-0 flex-1 truncate">
              {{ getMessagePreview(entry.formatted) }}
            </span>
            <span class="text-c-3">{{ entry.time }}</span>
            <ScalarIconCaretDown
              class="text-c-3 size-3 shrink-0 transition-transform"
              :class="{ 'rotate-180': isMessageEntryExpanded(entry) }" />
          </button>
          <div
            v-if="isMessageEntryExpanded(entry)"
            class="ml-5 flex flex-col gap-1">
            <div class="flex items-center justify-end">
              <ScalarListbox
                :modelValue="getMessageDisplayFormatOption(entry)"
                :options="MESSAGE_DISPLAY_FORMAT_OPTIONS"
                placement="bottom-end"
                teleport
                @update:modelValue="
                  (option) => handleSelectDisplayFormat(entry, option)
                ">
                <ScalarButton
                  class="text-c-2 hover:text-c-1 flex gap-1.5 px-2 py-1 text-xs font-normal"
                  size="sm"
                  variant="ghost">
                  {{ getMessageDisplayFormatOption(entry)?.label ?? 'JSON' }}
                  <ScalarIconCaretDown
                    class="ui-open:rotate-180 size-3 transition-transform duration-100"
                    weight="bold" />
                </ScalarButton>
              </ScalarListbox>
            </div>
            <ScalarCodeBlock
              class="bg-b-2 rounded text-xs"
              copy="hover"
              :lang="getMessageHighlightLanguage(entry)"
              :prettyPrintedContent="entry.formatted" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
