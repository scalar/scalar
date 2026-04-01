<script setup lang="ts">
import { ApiReference } from '@scalar/api-reference'
import '@scalar/api-reference/style.css'

const apiSpec = {
  openapi: '3.1.0',
  info: {
    title: 'Nuxt Hydration Test API',
    version: '1.0.0',
  },
  paths: {
    '/ping': {
      get: {
        operationId: 'ping',
        responses: {
          '200': {
            description: 'Successful response',
          },
        },
      },
    },
  },
}

const configuration = {
  spec: {
    content: apiSpec,
  },
}
</script>

<template>
  <main>
    <ApiReference :configuration="configuration" />
  </main>
</template>
