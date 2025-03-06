<script setup lang="ts">
import {
  ApiReference,
  type ApiReferenceConfiguration,
} from '@scalar/api-reference'
import content from '@scalar/galaxy/latest.yaml?raw'
import { reactive } from 'vue'

const configuration = reactive<Partial<ApiReferenceConfiguration>>({
  theme: 'default',
  proxyUrl: import.meta.env.VITE_REQUEST_PROXY_URL,
  isEditable: false,
  layout: 'classic',
  content,
})
</script>
<template>
  <ApiReference :configuration="configuration" />
</template>
