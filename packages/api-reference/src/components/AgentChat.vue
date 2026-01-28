<script setup lang="ts">
import { Chat } from '@scalar/agent-chat'

import { API_BASE_URL, DASHBOARD_URL, REGISTRY_URL } from '@/consts/urls'
</script>

<template>
  <Chat
    :baseUrl="API_BASE_URL"
    :dashboardUrl="DASHBOARD_URL"
    :getAccessToken="() => ''"
    mode="preview"
    :registryDocuments="[]"
    :registryUrl="REGISTRY_URL" />
</template>
