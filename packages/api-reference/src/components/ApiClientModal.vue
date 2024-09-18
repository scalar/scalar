<script setup lang="ts">
import {
  getUrlFromServerState,
  useAuthenticationStore,
  useServerStore,
} from '#legacy'
import type { Spec, SpecConfiguration } from '@scalar/types/legacy'
import { type App, onBeforeUnmount, onMounted, ref, watch } from 'vue'

import { apiClientBus, modalStateBus } from './api-client-bus'

const props = defineProps<{
  proxyUrl?: string
  spec?: SpecConfiguration
  servers?: Spec['servers']
}>()

const el = ref<HTMLDivElement | null>(null)
const appRef = ref<App<HTMLDivElement> | null>(null)

const { authentication } = useAuthenticationStore()
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

  modalStateBus.emit(modalState)

  // Event bus to listen to apiClient events
  apiClientBus.on((event) => {
    // Right now we just update auth every time we open but eventually we should do it when something in auth changes
    // if (event.updateAuth) updateAuth(event.updateAuth)
    if (event.open) {
      updateAuth(authentication)

      open(event.open)
    }

    if (event.updateSpec) updateSpec(event.updateSpec)
  })

  // Update the server on select
  watch(server, (newServer) => {
    const serverUrl = getUrlFromServerState(newServer)
    if (serverUrl) updateServer(serverUrl)
  })

  watch(
    () => props.spec,
    (newSpec) => newSpec && updateSpec(newSpec),
    { deep: true },
  )

  appRef.value = app
})

onBeforeUnmount(() => appRef.value?.unmount())
</script>

<template>
  <div ref="el" />
</template>

<style>
@import '@scalar/api-client/style.css';
</style>
