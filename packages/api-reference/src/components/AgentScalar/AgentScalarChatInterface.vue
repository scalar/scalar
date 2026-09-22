<script setup lang="ts">
import { Chat } from '@scalar/agent-chat'
import type {
  ApiReferenceConfigurationWithSource,
  ExternalUrls,
} from '@scalar/types/api-reference'
import type { Ref } from 'vue'

import type { ReferenceStore } from '@/helpers/create-reference-store'

const {
  agentScalarConfiguration,
  externalUrls,
  workspaceStore,
  prefilledMessage,
} = defineProps<{
  agentScalarConfiguration?: ApiReferenceConfigurationWithSource['agent']
  externalUrls: ExternalUrls
  workspaceStore: ReferenceStore
  prefilledMessage?: Ref<string>
}>()
</script>

<template>
  <Chat
    :baseUrl="externalUrls.apiBaseUrl"
    :dashboardUrl="externalUrls.dashboardUrl"
    :getActiveDocumentJson="() => workspaceStore.exportActiveDocument('json')!"
    :getAgentKey="
      agentScalarConfiguration?.key
        ? () => agentScalarConfiguration?.key ?? ''
        : undefined
    "
    :hideAddApi="agentScalarConfiguration?.hideAddApi"
    :mode="agentScalarConfiguration?.key ? 'full' : 'preview'"
    :platformProxyUrl="externalUrls.proxyUrl"
    :prefilledMessage="prefilledMessage"
    :registryDocuments="[]"
    :registryUrl="externalUrls.registryUrl" />
</template>
