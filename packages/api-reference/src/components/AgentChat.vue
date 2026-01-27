<script setup lang="ts">
import { Chat } from '@scalar/agent-chat'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'

import { API_BASE_URL, DASHBOARD_URL, REGISTRY_URL } from '@/consts/urls'

const { workspaceStore } = defineProps<{
  workspaceStore: WorkspaceStore
  eventBus: WorkspaceEventBus
}>()
</script>

<template>
  <Chat
    :baseUrl="API_BASE_URL"
    :dashboardUrl="DASHBOARD_URL"
    :eventBus
    :getAccessToken="() => ''"
    mode="preview"
    :registryDocuments="[]"
    :registryUrl="REGISTRY_URL"
    :workspaceStore />
</template>
