<script setup lang="ts">
import { Chat } from '@scalar/agent-chat'
import { type ApiReferenceConfigurationWithSource } from '@scalar/types/api-reference'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import type { Ref } from 'vue'

import { API_BASE_URL, DASHBOARD_URL, REGISTRY_URL } from '@/consts/urls'

const { agentConfig, workspaceStore, prefilledMessage } = defineProps<{
  agentConfig: ApiReferenceConfigurationWithSource['agent']
  workspaceStore: WorkspaceStore
  /** Ref for reactive prefill (from useAgent().prefilledMessage); when openAgent(message) runs, prompt updates */
  prefilledMessage?: Ref<string>
}>()
</script>

<template>
  <Chat
    :baseUrl="API_BASE_URL"
    :dashboardUrl="DASHBOARD_URL"
    :getActiveDocumentJson="() => workspaceStore.exportActiveDocument('json')!"
    :getAgentKey="agentConfig?.key ? () => agentConfig?.key : undefined"
    :mode="agentConfig?.key ? 'full' : 'preview'"
    :prefilledMessage="prefilledMessage"
    :registryDocuments="[]"
    :registryUrl="REGISTRY_URL" />
</template>
