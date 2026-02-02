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
  isLoggedIn,
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
  isLoggedIn?: Ref<boolean>
  prefilledMessage?: Ref<string>
}>()

defineEmits<{
  (e: 'uploadApi'): void
}>()

const state = createState({
  getActiveDocumentJson,
  initialRegistryDocuments: registryDocuments,
  prefilledMessageRef: prefilledMessage,
  registryUrl,
  baseUrl,
  mode,
  getAccessToken,
  getAgentKey,
  isLoggedIn,
  dashboardUrl,
})

provide(STATE_SYMBOL, state)

export type ChatExposed = {
  addDocumentAsync: typeof state.addDocumentAsync
}

defineExpose<ChatExposed>({
  addDocumentAsync: state.addDocumentAsync,
})
</script>

<template>
  <Chat @uploadApi="$emit('uploadApi')" />
</template>

<style scoped></style>
