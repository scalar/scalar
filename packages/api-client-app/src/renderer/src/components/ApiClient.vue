<script lang="ts" setup>
import { createApiClientApp } from '@scalar/api-client'
import { onMounted, ref } from 'vue'

const client = ref<HTMLElement | null>(null)

onMounted(async () => {
  // Initialize
  await createApiClientApp(client.value, {
    spec: {
      url: 'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.json',
    },
    proxyUrl: 'https://proxy.scalar.com',
  })
})
</script>

<template>
  <div ref="client"></div>
</template>

<style>
@import '@scalar/api-client/style.css';
</style>
