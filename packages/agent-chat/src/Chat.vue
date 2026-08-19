<script setup lang="ts">
import {
  createApiClientModal,
  type ApiClientModal,
} from '@scalar/api-client/modal'
import { ChatRoot, type ChatCopyOverride } from '@scalar/chat'
import { onBeforeUnmount, onMounted, ref, useTemplateRef } from 'vue'

import { useAgentKeyDocuments } from '@/hooks/use-agent-key-documents'
import { useChatScroll } from '@/hooks/use-chat-scroll'
import { useCuratedDocuments } from '@/hooks/use-curated-documents'
import { getTmpDocFromLocalStorage } from '@/hooks/use-upload-tmp-document'
import { useState } from '@/state/state'
import Layout from '@/views/Layout.vue'
import Settings from '@/views/Settings/Settings.vue'

defineEmits<{
  (e: 'uploadApi'): void
}>()

const {
  chat,
  prompt,
  settingsModal,
  eventBus,
  workspaceStore,
  config,
  mode,
  addDocument,
} = useState()

const clientModalRef = useTemplateRef<HTMLElement>('clientModal')
const apiClient = ref<ApiClientModal | null>(null)

onMounted(async () => {
  const tmpDoc = getTmpDocFromLocalStorage()

  if (mode === 'preview' && tmpDoc) {
    await addDocument({
      namespace: tmpDoc.namespace,
      slug: tmpDoc.slug,
      removable: false,
      tmp: true,
    })
  }

  if (!clientModalRef.value) {
    return
  }

  apiClient.value = createApiClientModal({
    el: clientModalRef.value,
    options: config,
    eventBus,
    workspaceStore,
  })
})

onBeforeUnmount(() => {
  apiClient.value?.app.unmount()
})

useChatScroll()
useAgentKeyDocuments()
useCuratedDocuments()

/** Start.vue renders its own disclaimer, so the kit's footnote is cleared. */
const CHAT_COPY: ChatCopyOverride = {
  composer: { placeholder: 'Ask me anything…' },
  disclaimer: { short: '' },
}

async function handleSubmit() {
  await chat.sendMessage({ text: prompt.value })
}
</script>

<template>
  <div ref="clientModal" />
  <ChatRoot :copy="CHAT_COPY">
    <Layout
      @submit="handleSubmit"
      @uploadApi="$emit('uploadApi')" />
  </ChatRoot>
  <Settings :modalState="settingsModal" />
</template>
