<script setup lang="ts">
import type { Spec } from '@scalar/oas-utils'
import { onMounted, ref, toRaw } from 'vue'

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

  const { createScalarClient } = await import('@scalar/api-client-modal')
  const { open } = await createScalarClient(el.value, {
    // TODO need @hans to figure out why this gives an error
    // parsedSpec: toRaw(props.parsedSpec),
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
