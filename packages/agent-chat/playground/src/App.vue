<script setup lang="ts">
import { createWorkspaceStore } from '@scalar/workspace-store/client'
import { createWorkspaceEventBus } from '@scalar/workspace-store/events'

import { Chat } from '@/index'

const workspaceStore = createWorkspaceStore()
const eventBus = createWorkspaceEventBus()

const params = new URLSearchParams(window.location.search)

const namespace = params.get('namespace') ?? 'scalar'
const slug = params.get('slug') ?? 'galaxy'
</script>

<template>
  <Chat
    dashboardUrl="http://localhost:3560"
    baseUrl="http://localhost:9999"
    :eventBus
    :getAccessToken="() => 'missing-token'"
    :registryDocuments="[{ namespace, slug }]"
    registryUrl="http://127.0.0.1:3080"
    :workspaceStore />
</template>

<style scoped></style>
