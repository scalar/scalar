<script setup lang="ts">
import type { Ref } from 'vue'

import Chat from '@/Chat.vue'
import { createState, type RegistryDocument } from '@/state/state'
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
  prefilledMessage?: Ref<string>
}>()

const store = createState({
  getActiveDocumentJson,
  initialRegistryDocuments: registryDocuments,
  prefilledMessageRef: prefilledMessage,
  registryUrl,
  baseUrl,
  mode,
  getAccessToken,
  getAgentKey,
  dashboardUrl,
})
</script>

<template>
  <Chat :store="store" />
</template>

<style scoped></style>
