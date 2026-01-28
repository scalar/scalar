<script setup lang="ts">
import { Chat } from '@scalar/agent-chat'
import { type ApiReferenceConfigurationWithSource } from '@scalar/types/api-reference'

import { API_BASE_URL, DASHBOARD_URL, REGISTRY_URL } from '@/consts/urls'

const { agentConfig } = defineProps<{
  agentConfig: ApiReferenceConfigurationWithSource['agent']
}>()
</script>

<template>
  <Chat
    :baseUrl="API_BASE_URL"
    :dashboardUrl="DASHBOARD_URL"
    :getAccessToken="() => ''"
    :mode="agentConfig?.key ? 'full' : 'preview'"
    :registryDocuments="[]"
    :registryUrl="REGISTRY_URL" />
</template>
