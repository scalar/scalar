<script setup lang="ts">
import { getUrlFromServerState, useExampleStore, useServerStore } from '#legacy'
import type { ClientConfiguration } from '@scalar/api-client/libs'
import { useWorkspace } from '@scalar/api-client/store'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

import { useApiClient } from './useApiClient'

const { configuration } = defineProps<{
  configuration: ClientConfiguration
}>()

const el = ref<HTMLDivElement | null>(null)

const { server, setServer } = useServerStore()
const { client, init } = useApiClient()
const { selectedExampleKey, operationId } = useExampleStore()
const store = useWorkspace()

onMounted(async () => {
  if (!el.value) return

  // Initialize the new client hook
  const _client = await init({
    el: el.value,
    configuration,
    store,
  })

  // Update the references server when the client server changes
  _client.onUpdateServer((url) => {
    if (!server.servers) return
    const index = server.servers.findIndex((s) => s.url === url)
    if (index >= 0) setServer({ selectedServer: index })
  })
})

// Update the server on select
watch(server, (newServer) => {
  const { originalUrl } = getUrlFromServerState(newServer)
  if (originalUrl && client.value) {
    client.value.updateServer(originalUrl, server.variables)
  }
})

// Update the config on change
watch(
  () => configuration,
  (_config) => _config && client.value?.updateConfig(_config),
  { deep: true },
)

watch(selectedExampleKey, (newKey) => {
  if (client.value && newKey && operationId.value) {
    client.value.updateExample(newKey, operationId.value)
  }
})

onBeforeUnmount(() => client.value?.app.unmount())
</script>

<template>
  <div ref="el" />
</template>
