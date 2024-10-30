<script setup lang="ts">
import { getUrlFromServerState, useServerStore } from '#legacy'
import type { ClientConfiguration } from '@scalar/api-client/libs'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

import { useApiClient } from './useApiClient'

const { configuration } = defineProps<{
  configuration: ClientConfiguration
}>()

const el = ref<HTMLDivElement | null>(null)

const { server, setServer } = useServerStore()
const { client, init } = useApiClient()

onMounted(async () => {
  if (!el.value) return

  // Initialize the new client hook
  const _client = await init({
    el: el.value,
    ...configuration,
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
  const serverUrl = getUrlFromServerState(newServer)
  if (serverUrl && client.value) client.value.updateServer(serverUrl)
})

// Update the config on change
watch(
  () => configuration,
  (_config) => _config && client.value?.updateConfig(_config),
  { deep: true },
)

onBeforeUnmount(() => client.value?.app.unmount())
</script>

<template>
  <div ref="el" />
</template>
