<script setup lang="ts">
import {
  getUrlFromServerState,
  useAuthenticationStore,
  useServerStore,
} from '#legacy'
import type { SpecConfiguration } from '@scalar/oas-utils'
import { type App, onBeforeUnmount, onMounted, ref, watch } from 'vue'

import { apiClientBus, modalStateBus } from './api-client-bus'

const props = defineProps<{
  proxyUrl?: string
  spec?: SpecConfiguration
}>()

const el = ref<HTMLDivElement | null>(null)
const appRef = ref<App<HTMLDivElement> | null>(null)

const { authentication } = useAuthenticationStore()
const { server } = useServerStore()

onMounted(async () => {
  if (!el.value) return

  const { createScalarApiClient } = await import('@scalar/api-client')

  const { app, open, updateAuth, updateServerUrl, modalState, updateSpec } =
    await createScalarApiClient(el.value, {
      spec: props.spec ?? {},
      proxyUrl: props.proxyUrl,
    })

  modalStateBus.emit(modalState)

  // Event bus to listen to apiClient events
  apiClientBus.on((event) => {
    // Right now we just update auth every time we open but eventually we should do it when something in auth changes
    // if (event.updateAuth) updateAuth(event.updateAuth)
    if (event.open) {
      updateAuth(authentication)

      // Just replace the current server with this string
      const serverUrl = getUrlFromServerState(server)
      if (serverUrl) updateServerUrl(serverUrl)

      open(event.open)
    }

    if (event.updateSpec) updateSpec(event.updateSpec)
  })

  watch(
    () => props.spec,
    (newSpec) => newSpec && updateSpec(newSpec),
    { deep: true },
  )

  // @ts-expect-error not sure why this complains about the type, ends up working correctly
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
