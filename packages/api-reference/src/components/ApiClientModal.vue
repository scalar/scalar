<script setup lang="ts">
import type { Spec } from '@scalar/oas-utils'
import { onMounted, ref } from 'vue'

import { apiClientBus } from './api-client-bus'

const props = defineProps<{
  parsedSpec: Spec
  proxyUrl?: string
}>()

const el = ref<HTMLDivElement | null>(null)

onMounted(async () => {
  if (!el.value) return

  console.log(props.parsedSpec)
  console.log(props.proxyUrl)

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
