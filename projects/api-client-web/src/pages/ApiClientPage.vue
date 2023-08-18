<script setup lang="ts">
import { ApiClient } from '@scalar/api-client'
import { useApiClientRequestStore } from '@scalar/api-client'

// import '@scalar/api-client/style.css'

const { readOnly } = useApiClientRequestStore()

readOnly.value = false
</script>

<template>
  <ApiClient proxy-url="http://localhost:4800" />
</template>
