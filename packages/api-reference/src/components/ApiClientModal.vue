<script setup lang="ts">
import { getUrlFromServerState, useServerStore } from '#legacy'
import type { Spec, SpecConfiguration } from '@scalar/types/legacy'
import { type App, onBeforeUnmount, onMounted, ref, watch } from 'vue'

import { apiClientBus, modalStateBus } from './api-client-bus'

const props = defineProps<{
  proxyUrl?: string
  spec?: SpecConfiguration
  servers?: Spec['servers']
}>()

// We only add the types we are using, we cannot import the type due to lazy load
type Client = {
  app: App<HTMLDivElement>
  updateServer: (serverUrl: string) => void
  updateSpec: (spec: SpecConfiguration) => void
}

const el = ref<HTMLDivElement | null>(null)
const client = ref<Client | null>(null)

const { server } = useServerStore()

onMounted(async () => {
  if (!el.value) return

  const { createApiClientModal } = await import('@scalar/api-client')

  const { app, open, updateAuth, modalState, updateSpec, updateServer } =
    await createApiClientModal(el.value, {
      spec: props.spec ?? {},
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
