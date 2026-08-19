<script setup lang="ts">
import { toolCardStatus, type ToolPartLike } from '@scalar/chat-protocol'
import { chatFixtures } from '@scalar/chat-protocol/fixtures'
import { computed, onUnmounted, ref } from 'vue'

import { CHAT_VIEWPORT_ANCHOR_ATTRIBUTE } from '@/components/chat-viewport'
import ChatApprovalBar from '@/components/ChatApprovalBar.vue'
import ChatComposer from '@/components/ChatComposer.vue'
import ChatDiff from '@/components/ChatDiff.vue'
import ChatMarkdown from '@/components/ChatMarkdown.vue'
import ChatRoot from '@/components/ChatRoot.vue'
import ChatSend from '@/components/ChatSend.vue'
import ChatStatusBadge from '@/components/ChatStatusBadge.vue'
import ChatToolCard from '@/components/ChatToolCard.vue'
import ChatToolFallbackCard from '@/components/ChatToolFallbackCard.vue'
import ChatViewport from '@/components/ChatViewport.vue'
import type { ChatDensity } from '@/density'

const density = ref<ChatDensity>('default')
const darkMode = ref(false)

const toggleDark = (): void => {
  darkMode.value = !darkMode.value
  document.body.classList.toggle('dark-mode', darkMode.value)
}

const TOOL_CARD_STATUSES = [
  'pending',
  'running',
  'awaiting-approval',
  'applying',
  'complete',
  'failed',
  'rejected',
] as const

const badgeLabels: Record<(typeof TOOL_CARD_STATUSES)[number], string> = {
  'pending': 'Building request…',
  'running': 'Calling get_planets…',
  'awaiting-approval': 'Waiting for approval',
  'applying': 'Sending request…',
  'complete': 'Called POST /planets · 200 OK',
  'failed': 'Request failed · network error',
  'rejected': 'Request rejected',
}

const fallbackParts = computed<ToolPartLike[]>(() => {
  const parts: ToolPartLike[] = []

  for (const fixture of Object.values(chatFixtures)) {
    for (const message of fixture) {
      for (const part of message.parts) {
        if (
          typeof part.type === 'string' &&
          (part.type.startsWith('tool-') || part.type === 'dynamic-tool')
        ) {
          parts.push(part as unknown as ToolPartLike)
        }
      }
    }
  }

  return parts
})

// Composer + streaming simulation
const prompt = ref('')
const streaming = ref(false)
const streamedMarkdown = ref('')
const anchorKey = ref<string | undefined>(undefined)
const messageCount = ref(0)
const transcript = ref<
  { id: string; role: 'user' | 'assistant'; text: string }[]
>([])

const CHUNKS = [
  '## The Galaxy API\n\nHere is what I found',
  ' about the planets endpoint.\n\n',
  '```json\n{ "planets": ["Tatooine", "Hoth"',
  ', "Endor"] }\n```\n\n',
  'You can create a planet with `POST /planets`.',
  ' Want me to build that request?',
]

let streamInterval: ReturnType<typeof setInterval> | undefined

const stopStreaming = (): void => {
  clearInterval(streamInterval)
  streamInterval = undefined
  streamedMarkdown.value = ''
  streaming.value = false
}

const submit = (text: string): void => {
  // A previous simulated stream must not keep writing into the shared
  // buffer after Stop or a re-send.
  stopStreaming()

  transcript.value.push({ id: `user-${Date.now()}`, role: 'user', text })
  prompt.value = ''
  anchorKey.value = transcript.value.at(-1)?.id
  messageCount.value += 1
  streaming.value = true

  let index = 0
  streamInterval = setInterval(() => {
    const chunk = CHUNKS[index]

    if (chunk === undefined) {
      clearInterval(streamInterval)
      streamInterval = undefined
      transcript.value.push({
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        text: streamedMarkdown.value,
      })
      streamedMarkdown.value = ''
      streaming.value = false
      return
    }

    streamedMarkdown.value += chunk
    index += 1
  }, 350)
}

onUnmounted(stopStreaming)

const approvals = ref([
  {
    toolCallId: 'call-1',
    toolName: 'execute-request',
    action: 'POST /planets',
  },
  {
    toolCallId: 'call-2',
    toolName: 'write_file',
    action: 'Apply edit to guides/auth.md',
    destructive: true,
  },
])

const diffRows = {
  contextBefore: [
    { line: 10, text: 'servers:' },
    { line: 11, text: '  - url: https://api.example.com' },
  ],
  removed: [{ line: null, text: '  - url: http://legacy.example.com' }],
  added: [{ line: 12, text: '  - url: https://staging.example.com' }],
  contextAfter: [{ line: 13, text: 'paths:' }],
}
</script>

<template>
  <ChatRoot :density="density">
    <main class="playground">
      <header class="playground-controls">
        <h1>@scalar/chat</h1>
        <label>
          Density
          <select v-model="density">
            <option value="default">default</option>
            <option value="compact">compact</option>
          </select>
        </label>
        <button
          type="button"
          @click="toggleDark">
          {{ darkMode ? 'Light' : 'Dark' }} mode
        </button>
      </header>

      <section>
        <h2>ChatStatusBadge — every status</h2>
        <ChatStatusBadge
          v-for="status in TOOL_CARD_STATUSES"
          :key="status"
          :status="status"
          :label="badgeLabels[status]" />
      </section>

      <section>
        <h2>ChatToolCard — every status</h2>
        <ChatToolCard
          v-for="status in TOOL_CARD_STATUSES"
          :key="status"
          verb="write"
          path="guides/authentication.md"
          :status="status">
          <template #stats>
            <span>+12 −3</span>
          </template>
          <ChatDiff v-bind="diffRows" />
        </ChatToolCard>
      </section>

      <section>
        <h2>ChatToolFallbackCard — every fixture part</h2>
        <ChatToolFallbackCard
          v-for="part in fallbackParts"
          :key="part.toolCallId"
          :part="part" />
        <p class="playground-note">
          Statuses:
          {{ fallbackParts.map((part) => toolCardStatus(part)).join(' · ') }}
        </p>
      </section>

      <section>
        <h2>ChatMarkdown + ChatViewport — live stream</h2>
        <ChatViewport
          class="playground-viewport"
          :streaming="streaming"
          :anchor-key="anchorKey"
          chat-key="playground">
          <div
            v-for="message in transcript"
            :key="message.id"
            class="playground-message"
            v-bind="
              message.role === 'user'
                ? { [CHAT_VIEWPORT_ANCHOR_ATTRIBUTE]: '' }
                : {}
            ">
            <strong>{{ message.role }}</strong>
            <ChatMarkdown
              :content="message.text"
              :streaming="false" />
          </div>
          <div
            v-if="streamedMarkdown"
            class="playground-message">
            <strong>assistant</strong>
            <ChatMarkdown
              :content="streamedMarkdown"
              :streaming="streaming" />
          </div>
        </ChatViewport>
      </section>

      <section>
        <h2>ChatComposer — stacked, with approval bar</h2>
        <ChatComposer
          v-model="prompt"
          :streaming="streaming"
          :send-disabled="approvals.length > 0"
          @submit="submit"
          @stop="stopStreaming">
          <template #banners>
            <ChatApprovalBar
              :approvals="approvals"
              @approve="approvals = []"
              @reject="approvals = []" />
          </template>
        </ChatComposer>
      </section>

      <section>
        <h2>ChatComposer — inline</h2>
        <ChatComposer
          v-model="prompt"
          layout="inline"
          :streaming="streaming"
          @submit="submit"
          @stop="stopStreaming" />
      </section>

      <section>
        <h2>ChatSend states</h2>
        <div class="playground-row">
          <ChatSend :streaming="false" />
          <ChatSend :streaming="true" />
          <ChatSend
            :streaming="false"
            disabled />
        </div>
      </section>
    </main>
  </ChatRoot>
</template>

<style scoped>
.playground {
  max-width: 720px;
  margin: 0 auto;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 32px;
  background: var(--scalar-background-1);
  color: var(--scalar-color-1);
}
.playground-controls {
  display: flex;
  align-items: center;
  gap: 16px;
}
.playground-viewport {
  height: 320px;
  border: var(--scalar-border-width) solid var(--scalar-border-color);
  border-radius: var(--scalar-radius-md);
  padding: 12px;
}
.playground-message {
  margin-bottom: 12px;
}
.playground-row {
  display: flex;
  gap: 12px;
  align-items: center;
}
.playground-note {
  font-size: var(--chat-font-meta);
  color: var(--scalar-color-3);
}
section > h2 {
  font-size: 14px;
  margin-bottom: 8px;
  color: var(--scalar-color-2);
}
</style>
