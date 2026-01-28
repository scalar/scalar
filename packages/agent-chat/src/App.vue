<script setup lang="ts">
import { provide } from 'vue'

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
} = defineProps<{
  registryDocuments: RegistryDocument[]
  registryUrl: string
  dashboardUrl: string
  baseUrl: string
  mode?: ChatMode
  getAccessToken?: () => string
  getAgentKey?: () => string
}>()

provide(
  STATE_SYMBOL,
  createState({
    initialRegistryDocuments: registryDocuments,
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
