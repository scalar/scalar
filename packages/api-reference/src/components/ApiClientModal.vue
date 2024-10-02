<script setup lang="ts">
import { getUrlFromServerState, useServerStore } from '#legacy'
import type { ApiClient } from '@scalar/api-client/libs'
import type { Spec, SpecConfiguration } from '@scalar/types/legacy'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

import { apiClientBus, modalStateBus } from './api-client-bus'

const props = defineProps<{
  proxyUrl?: string
  preferredSecurityScheme?: string | null
  spec?: SpecConfiguration
  servers?: Spec['servers']
}>()

const el = ref<HTMLDivElement | null>(null)
const client = ref<ApiClient | null>(null)

const { server, setServer } = useServerStore()

onMounted(async () => {
  if (!el.value) return

  const { createApiClientModal } = await import('@scalar/api-client')

  const {
    app,
    open,
    updateAuth,
    modalState,
    updateSpec,
    updateServer,
    onUpdateServer,
  } = await createApiClientModal(el.value, {
    spec: props.spec ?? {},
    preferredSecurityScheme: props.preferredSecurityScheme,
    proxyUrl: props.proxyUrl,
    servers: props.servers,
  })

  client.value = {
    // @ts-expect-error not sure what the beef with app is, possible router related
    app,
    updateSpec,
    updateServer,
  }

  modalStateBus.emit(modalState)

  // Update the references server when the client server changes
  onUpdateServer((url) => {
    if (!server.servers) return
    const index = server.servers.findIndex((s) => s.url === url)
    if (index >= 0) setServer({ selectedServer: index })
  })

  // Event bus to listen to apiClient events
  apiClientBus.on((event) => {
    if (event.open) open(event.open)
    if (event.updateSpec) updateSpec(event.updateSpec)
    if (event.updateAuth) updateAuth(event.updateAuth)
  })
})

// Update the server on select
watch(server, (newServer) => {
  const serverUrl = getUrlFromServerState(newServer)
  if (serverUrl && client.value) client.value.updateServer(serverUrl)
})

// Update the spec on change
watch(
  () => props.spec,
  (newSpec) => newSpec && client.value?.updateSpec(newSpec),
  { deep: true },
)

onBeforeUnmount(() => client.value?.app.unmount())
</script>

<template>
  <div ref="el" />
</template>

<style>
@import '@scalar/api-client/style.css';
</style>
