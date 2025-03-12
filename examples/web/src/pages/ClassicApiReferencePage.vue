<script setup lang="ts">
import { ApiReference } from '@scalar/api-reference'
import content from '@scalar/galaxy/latest.yaml?raw'
import { apiReferenceConfigurationSchema } from '@scalar/types/api-reference'
import { reactive } from 'vue'

const configuration = reactive(
  apiReferenceConfigurationSchema.parse({
    theme: 'default',
    proxyUrl: import.meta.env.VITE_REQUEST_PROXY_URL,
    isEditable: false,
    layout: 'classic',
    content,
  }),
)
</script>
<template>
  <ApiReference :configuration="configuration" />
</template>
