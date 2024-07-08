<script lang="ts" setup>
import { createScalarApiClient } from '@scalar/api-client'
import { onMounted, ref } from 'vue'

const client = ref<HTMLElement | null>(null)

onMounted(async () => {
  // Initialize
  const { open } = await createScalarApiClient(client.value, {
    spec: {
      url: 'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.json',
    },
    proxyUrl: 'https://proxy.scalar.com',
  })

  // Open the API client right-away
  open()
})
</script>

<template>
  <div ref="client"></div>
</template>

<style>
@import '@scalar/api-client/style.css';
</style>
