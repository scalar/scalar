<script setup lang="ts">
import { onMounted, onUnmounted, provide, type Ref } from 'vue'

import Chat from '@/Chat.vue'
import { createState, STATE_SYMBOL, type RegistryDocument } from '@/state/state'
import { type ChatMode } from '@/types'

const {
  dashboardUrl,
  platformProxyUrl,
  registryDocuments,
  registryUrl,
  baseUrl,
  mode = 'full',
  getAccessToken,
  getAgentKey,
  getActiveDocumentJson,
  isLoggedIn,
  prefilledMessage,
  hideAddApi,
} = defineProps<{
  registryDocuments: RegistryDocument[]
  registryUrl: string
  dashboardUrl: string
  platformProxyUrl: string
  baseUrl: string
  mode?: ChatMode
  getAccessToken?: () => string
  getAgentKey?: () => string
  getActiveDocumentJson?: () => string
  isLoggedIn?: Ref<boolean>
  prefilledMessage?: Ref<string>
  hideAddApi?: boolean
}>()

const emit = defineEmits<{
  (e: 'uploadApi'): void
  /**
   * The user pressed Escape. Emitted rather than handled here so each host
   * decides what to dismiss: an embedding drawer closes, while the standalone
   * page has no listener and does nothing.
   */
  (e: 'close'): void
}>()

/**
 * Escape asks the host to dismiss the chat. A nested overlay that already
 * handled Escape (calling preventDefault) wins, and an Escape that only cancels
 * an IME composition must never bubble up as a dismiss.
 */
const onDocumentKeydown = (event: KeyboardEvent): void => {
  if (event.key !== 'Escape' || event.defaultPrevented || event.isComposing) {
    return
  }

  emit('close')
}

onMounted(() => document.addEventListener('keydown', onDocumentKeydown))
onUnmounted(() => document.removeEventListener('keydown', onDocumentKeydown))

const state = createState({
  getActiveDocumentJson,
  initialRegistryDocuments: registryDocuments,
  prefilledMessageRef: prefilledMessage,
  platformProxyUrl,
  registryUrl,
  baseUrl,
  mode,
  getAccessToken,
  getAgentKey,
  isLoggedIn,
  dashboardUrl,
  hideAddApi,
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
