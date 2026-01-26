<script setup lang="ts">
import { createWorkspaceEventBus } from '@scalar/workspace-store/events'

import { useChatScroll } from '@/hooks/useChatScroll'
import { useState } from '@/state/state'
import Layout from '@/views/Layout.vue'
import Settings from '@/views/Settings/Settings.vue'

const { chat, prompt, settingsModal } = useState()

createWorkspaceEventBus({ debug: false })

useChatScroll()

async function handleSubmit() {
  await chat.sendMessage({ text: prompt.value })
}
</script>

<template>
  <Layout @submit="handleSubmit" />
  <Settings :modalState="settingsModal" />
</template>
