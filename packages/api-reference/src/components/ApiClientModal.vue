<script setup lang="ts">
import { useAuthenticationStore } from '@scalar/api-client'
import type { SpecConfiguration } from '@scalar/oas-utils'
import { onMounted, ref } from 'vue'

import { apiClientBus, modalStateBus } from './api-client-bus'

const props = defineProps<{
  proxyUrl?: string
  spec?: SpecConfiguration
}>()

const el = ref<HTMLDivElement | null>(null)
const { authentication } = useAuthenticationStore()

onMounted(async () => {
  if (!el.value) return

  const { createScalarApiClient } = await import('@scalar/api-client-modal')

  const { modalState, open, updateAuth } = await createScalarApiClient(
    el.value,
    {
      spec: props.spec ?? {},
      proxyUrl: props.proxyUrl,
    },
  )

  modalStateBus.emit(modalState)

  // Event bus to listen to apiClient events
  apiClientBus.on((event) => {
    // Right now we just update auth every time we open but eventually we should do it when something in auth changes
    // if (event.updateAuth) updateAuth(event.updateAuth)
    updateAuth(authentication)

    if (event.open) open(event.open)
  })
})
</script>
<template>
  <div ref="el" />
</template>
