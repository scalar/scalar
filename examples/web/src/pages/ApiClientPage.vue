<script setup lang="ts">
import { ApiClient, useRequestStore } from '@scalar/api-client'
import type { ThemeId } from '@scalar/themes'
import { ref, watch } from 'vue'

import DevApiClientOptions from '../components/DevApiClientOptions.vue'
import DevToolbar from '../components/DevToolbar.vue'

const { activeRequest, setActiveRequest } = useRequestStore()

// Store active request in local storage
watch(activeRequest, () => {
  const activeRequestFromStorage = window.localStorage.getItem('activeRequest')

  if (JSON.stringify(activeRequest) !== activeRequestFromStorage) {
    window.localStorage.setItem('activeRequest', JSON.stringify(activeRequest))
  }
})

// Restore active request from local storage
const activeRequestFromStorage = window.localStorage.getItem('activeRequest')

if (activeRequestFromStorage) {
  setActiveRequest(JSON.parse(activeRequestFromStorage))
}

const config = ref({
  proxyUrl: import.meta.env.VITE_REQUEST_PROXY_URL,
  readOnly: false,
  theme: 'default' as ThemeId,
})
</script>
<template>
  <div class="client-page">
    <DevToolbar><DevApiClientOptions v-model="config" /></DevToolbar>
    <ApiClient v-bind="config" />
  </div>
</template>
<style scoped>
.client-page {
  display: flex;
  flex-direction: column;
  height: 100dvh;
  width: 100dvw;
}
</style>
