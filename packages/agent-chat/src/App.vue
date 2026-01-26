<script setup lang="ts">
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import { type WorkspaceEventBus } from '@scalar/workspace-store/events'
import { provide } from 'vue'

import Chat from '@/Chat.vue'
import { createState, STATE_SYMBOL, type RegistryDocument } from '@/state/state'
import { type ChatMode } from '@/types'

const {
  eventBus,
  workspaceStore,
  registryDocuments,
  registryUrl,
  baseUrl,
  mode = 'full',
  getAccessToken,
} = defineProps<{
  eventBus: WorkspaceEventBus
  workspaceStore: WorkspaceStore
  registryDocuments: [RegistryDocument, ...RegistryDocument[]]
  registryUrl: string
  baseUrl: string
  mode?: ChatMode
  getAccessToken: () => string
}>()

provide(
  STATE_SYMBOL,
  createState({
    eventBus,
    workspaceStore,
    initialRegistryDocuments: registryDocuments,
    registryUrl,
    baseUrl,
    mode,
    getAccessToken,
  }),
)
</script>

<template>
  <Chat />
</template>

<style scoped></style>
