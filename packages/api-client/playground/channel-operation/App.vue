<script setup lang="ts">
import { addScalarClassesToHeadless } from '@scalar/components/helpers'
import { ScalarTeleportRoot } from '@scalar/components/teleport'
import { ScalarToasts } from '@scalar/use-toasts'
import { createWorkspaceStore } from '@scalar/workspace-store/client'
import { createWorkspaceEventBus } from '@scalar/workspace-store/events'
import { getActiveEnvironment } from '@scalar/workspace-store/request-example'
import { isAsyncApiDocument } from '@scalar/workspace-store/schemas/type-guards'
import { computed, onBeforeMount, onMounted, ref } from 'vue'

import ChannelOperation from '@/v2/features/channel-operation/ChannelOperation.vue'
import { initializeWorkspaceEventHandlers } from '@/v2/workspace-events'

import {
  ECHO_WEBSOCKET_CONNECTION_URL,
  ECHO_WEBSOCKET_DEFAULT_CHANNEL,
  ECHO_WEBSOCKET_DOCUMENT_SLUG,
  echoWebsocketAsyncApiDocument,
} from './fixtures/echo-websocket.asyncapi'

const DOCUMENT_SLUG = ECHO_WEBSOCKET_DOCUMENT_SLUG

const channelOptions = [{ id: 'echo', label: 'echo — WebSocket.org echo' }] as const

const channelName = ref<string>(ECHO_WEBSOCKET_DEFAULT_CHANNEL)

const workspaceStore = createWorkspaceStore({
  meta: {
    'x-scalar-active-document': DOCUMENT_SLUG,
  },
})

const eventBus = createWorkspaceEventBus({
  debug: import.meta.env.DEV,
})

initializeWorkspaceEventHandlers({
  eventBus,
  store: computed(() => workspaceStore),
  hooks: {},
})

const loadError = ref<string | null>(null)
const isLoading = ref(true)

onBeforeMount(() => {
  addScalarClassesToHeadless()
})

onMounted(async () => {
  try {
    await workspaceStore.addDocument({
      name: DOCUMENT_SLUG,
      document: echoWebsocketAsyncApiDocument,
    })
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : 'Failed to load AsyncAPI document'
  } finally {
    isLoading.value = false
  }
})

const document = computed(() => {
  const entry = workspaceStore.workspace.documents[DOCUMENT_SLUG]
  return entry && isAsyncApiDocument(entry) ? entry : null
})

const environment = computed(() => getActiveEnvironment(workspaceStore, document.value).environment)
</script>

<template>
  <ScalarToasts />
  <div class="bg-b-1 text-c-1 flex min-h-0 flex-1 flex-col">
    <header class="border-b px-4 py-2">
      <h1 class="text-c-1 text-sm font-medium">
        Channel connection playground
      </h1>
      <p class="text-c-3 text-xs">
        {{ DOCUMENT_SLUG }} · channel
        <code class="font-code">{{ channelName }}</code>
        ·
        <code class="font-code">{{ ECHO_WEBSOCKET_CONNECTION_URL }}</code>
      </p>
      <p class="text-c-3 mt-1 text-xs">
        One connection per channel — connect once, send and receive on the same session (like Postman).
      </p>
      <div class="mt-2 flex flex-wrap gap-2">
        <button
          v-for="option in channelOptions"
          :key="option.id"
          class="text-xxs rounded border px-2 py-1"
          :class="
            channelName === option.id
              ? 'border-c-1 bg-b-2 text-c-1'
              : 'text-c-3 border-transparent hover:bg-b-2'
          "
          type="button"
          @click="channelName = option.id">
          {{ option.label }}
        </button>
      </div>
    </header>

    <ScalarTeleportRoot class="flex min-h-0 flex-1 flex-col">
      <div
        v-if="isLoading"
        class="text-c-3 flex flex-1 items-center justify-center text-sm">
        Loading AsyncAPI document…
      </div>

      <div
        v-else-if="loadError"
        class="text-c-danger flex flex-1 items-center justify-center p-4 text-sm">
        {{ loadError }}
      </div>

      <ChannelOperation
        v-else-if="document"
        class="min-h-0 flex-1"
        :channelName="channelName"
        :document="document"
        :documentSlug="DOCUMENT_SLUG"
        :environment="environment"
        :eventBus="eventBus"
        layout="web"
        :plugins="[]"
        :workspaceStore="workspaceStore" />

      <div
        v-else
        class="text-c-3 flex flex-1 items-center justify-center text-sm">
        Document loaded but is not an AsyncAPI description.
      </div>
    </ScalarTeleportRoot>
  </div>
</template>
