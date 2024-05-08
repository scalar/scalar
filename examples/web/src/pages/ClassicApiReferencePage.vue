<script setup lang="ts">
import {
  ApiReference,
  type ReferenceConfiguration,
} from '@scalar/api-reference'
import content from '@scalar/galaxy/latest.yaml?raw'
import { reactive } from 'vue'

const configuration = reactive<ReferenceConfiguration>({
  theme: 'default',
  proxy: import.meta.env.VITE_REQUEST_PROXY_URL,
  isEditable: false,
  layout: 'classic',
  spec: { content },
})
</script>
<template>
  <ApiReference :configuration="configuration" />
</template>
