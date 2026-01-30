<script setup lang="ts">
import { provide, type Ref } from 'vue'

import Chat from '@/Chat.vue'
import { createState, STATE_SYMBOL, type RegistryDocument } from '@/state/state'
import { type ChatMode } from '@/types'

const {
  dashboardUrl,
  registryDocuments,
  registryUrl,
  baseUrl,
  mode = 'full',
  getAccessToken,
  getAgentKey,
  getActiveDocumentJson,
  prefilledMessage,
} = defineProps<{
  registryDocuments: RegistryDocument[]
  registryUrl: string
  dashboardUrl: string
  baseUrl: string
  mode?: ChatMode
  getAccessToken?: () => string
  getAgentKey?: () => string
  getActiveDocumentJson?: () => string
  /** Optional ref for reactive prefill (from openAgent(message)); when it changes, prompt updates */
  prefilledMessage?: Ref<string>
}>()

provide(
  STATE_SYMBOL,
  createState({
    getActiveDocumentJson,
    initialRegistryDocuments: registryDocuments,
    prefilledMessageRef: prefilledMessage,
    registryUrl,
    baseUrl,
    mode,
    getAccessToken,
    getAgentKey,
    dashboardUrl,
  }),
)
</script>

<template>
  <Chat />
</template>

<style scoped></style>
