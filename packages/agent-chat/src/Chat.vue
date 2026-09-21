<script setup lang="ts">
import { useLazyApiClient } from '@scalar/api-client/modal/use-lazy-api-client'
import { initializeWorkspaceEventHandlers } from '@scalar/api-client/v2/workspace-events'
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
// Authentication and server controls also work before the request editor opens.
const stopClientEvents = initializeWorkspaceEventHandlers({
  eventBus,
  store: ref(workspaceStore),
  hooks: {},
})
useLazyApiClient({
  eventBus,
  load: async () => {
    const { createApiClientModal } = await import('@scalar/api-client/modal')
    return () => {
      if (!clientModalRef.value) {
        return null
      }
      stopClientEvents()
      return createApiClientModal({
        el: clientModalRef.value,
        options: config,
        eventBus,
        workspaceStore,
      })
    }
  },
})
onBeforeUnmount(stopClientEvents)

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
})

useChatScroll()
useAgentKeyDocuments()
useCuratedDocuments()

async function handleSubmit() {
  await chat.sendMessage({ text: prompt.value })
}
</script>

<template>
  <div ref="clientModal" />
  <Layout
    @submit="handleSubmit"
    @uploadApi="$emit('uploadApi')" />
  <Settings :modalState="settingsModal" />
</template>
