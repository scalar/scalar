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
import type { WebSocketFrame } from '@/v2/blocks/channel-operation-block/helpers/websocket-session'

const { frames } = defineProps<{
  /** Chronological WebSocket frames */
  frames: WebSocketFrame[]
}>()

const emit = defineEmits<{
  (e: 'clear'): void
}>()

const contentContainer = ref<HTMLElement | null>(null)
const showJumpToLatest = ref(false)

const formattedFrames = computed(() =>
  [...frames].reverse().map((frame) => ({
    ...frame,
    formatted: formatFrameData(frame.data),
    time: new Date(frame.timestamp).toLocaleTimeString(),
  })),
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
</script>

<template>
  <div class="relative flex min-h-0 flex-1 flex-col">
    <div
      v-if="frames.length === 0"
      class="text-c-3 flex flex-1 items-center justify-center p-4 text-sm">
      Connect to start receiving messages
    </div>
    <ScalarButton
      v-if="frames.length && showJumpToLatest"
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
      v-if="frames.length"
      ref="contentContainer"
      class="custom-scroll flex flex-1 flex-col gap-2 overflow-y-auto p-3"
      @scroll="handleScroll">
      <div
        v-for="(frame, index) in formattedFrames"
        :key="`${frame.timestamp}-${index}`"
        class="flex flex-col gap-1">
        <div class="text-c-3 flex items-center gap-2 text-xs">
          <span
            class="font-code rounded px-1.5 py-0.5 font-bold"
            :class="
              frame.direction === 'incoming'
                ? 'bg-[var(--scalar-color-blue)]/20 text-[var(--scalar-color-blue)]'
                : 'bg-[var(--scalar-color-green)]/20 text-[var(--scalar-color-green)]'
            ">
            {{ frame.direction === 'incoming' ? 'IN' : 'OUT' }}
          </span>
          <span>{{ frame.time }}</span>
          <span
            v-if="frame.opcode === 'binary'"
            class="text-c-3">
            binary
          </span>
        </div>
        <pre
          class="text-c-1 bg-b-2 overflow-x-auto rounded p-2 font-mono text-xs leading-relaxed whitespace-pre-wrap">{{ frame.formatted }}</pre>
      </div>
    </div>
    <div
      v-if="frames.length"
      class="border-t p-2">
      <ScalarButton
        size="sm"
        variant="outlined"
        @click="emit('clear')">
        Clear log
      </ScalarButton>
    </div>
  </div>
</template>
