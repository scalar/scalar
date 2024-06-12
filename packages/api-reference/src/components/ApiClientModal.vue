<script setup lang="ts">
import { onMounted, ref } from 'vue'

import { apiClientBus } from './api-client-bus'

const props = defineProps<{
  proxyUrl?: string
}>()

const el = ref<HTMLDivElement | null>(null)

onMounted(async () => {
  if (!el.value) {
    return
  }

  const { createScalarApiClient } = await import('@scalar/api-client-modal')
  const { open } = await createScalarApiClient(el.value, {
    spec: {
      url: 'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.yaml',
    },
    proxyUrl: props.proxyUrl,
  })

  // Event bus to listen to apiClient events
  apiClientBus.on(open)
})
</script>
<template>
  <div ref="el" />
</template>
