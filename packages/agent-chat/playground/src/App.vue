<script setup lang="ts">
import { Chat } from '@/index'

const params = new URLSearchParams(window.location.search)

const namespace = params.get('namespace') ?? 'scalar'
const slug = params.get('slug') ?? 'galaxy'
</script>

<template>
  <Chat
    baseUrl="http://localhost:9999"
    dashboardUrl="http://localhost:3560"
    :getAccessToken="() => 'missing-token'"
    :registryDocuments="[{ namespace, slug }]"
    registryUrl="http://127.0.0.1:3080" />
</template>

<style scoped></style>
