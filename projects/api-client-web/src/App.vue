<script setup lang="ts">
import { ApiClient } from '@scalar/api-client'
import { useApiClientRequestStore } from '@scalar/api-client'

const { readOnly } = useApiClientRequestStore()

readOnly.value = false

// import '@scalar/api-client/dist/style.css'
// import '@scalar/api-client/dist/variables.css'
</script>

<template>
  <ApiClient proxyUrl="http://localhost:4800" />
</template>
