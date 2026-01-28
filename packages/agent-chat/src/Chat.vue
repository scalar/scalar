<script setup lang="ts">
import { createWorkspaceEventBus } from '@scalar/workspace-store/events'

import { useAgentKeyDocuments } from '@/hooks/use-agent-key-documents'
import { useChatScroll } from '@/hooks/use-chat-scroll'
import { useCuratedDocuments } from '@/hooks/use-curated-documents'
import { useState } from '@/state/state'
import Layout from '@/views/Layout.vue'
import Settings from '@/views/Settings/Settings.vue'

const { chat, prompt, settingsModal } = useState()

createWorkspaceEventBus({ debug: false })

useChatScroll()
useAgentKeyDocuments()
useCuratedDocuments()

async function handleSubmit() {
  await chat.sendMessage({ text: prompt.value })
}
</script>

<template>
  <Layout @submit="handleSubmit" />
  <Settings :modalState="settingsModal" />
</template>
