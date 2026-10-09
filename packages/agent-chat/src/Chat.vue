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
const clientLoadingStatus = ref<'idle' | 'loading' | 'error'>('idle')
useLazyApiClient({
  eventBus,
  status: clientLoadingStatus,
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
  <div
    v-if="clientLoadingStatus !== 'idle'"
    class="bg-b-1 text-c-1 fixed right-4 bottom-4 z-[10001] rounded-lg border px-4 py-3 text-sm shadow-lg"
    :role="clientLoadingStatus === 'error' ? 'alert' : 'status'">
    {{
      clientLoadingStatus === 'loading'
        ? 'Loading request editor…'
        : 'Could not load the request editor. Refresh the page and try again.'
    }}
  </div>
  <Layout
    @submit="handleSubmit"
    @uploadApi="$emit('uploadApi')" />
  <Settings :modalState="settingsModal" />
</template>
