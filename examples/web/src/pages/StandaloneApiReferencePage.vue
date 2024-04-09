<script setup lang="ts">
import {
  ApiReference,
  type ReferenceConfiguration,
} from '@scalar/api-reference'
import { reactive } from 'vue'

import SlotPlaceholder from '../components/SlotPlaceholder.vue'
import content from '../fixtures/petstorev3.json'

const configuration = reactive<ReferenceConfiguration>({
  proxy: import.meta.env.VITE_REQUEST_PROXY_URL,
  isEditable: false,
  // Add path routing option
  ...(window.location.pathname.startsWith('/path-routing')
    ? {
        pathRouting: { basePath: '/path-routing' },
      }
    : {}),
  spec: { content },
})
</script>
<template>
  <ApiReference :configuration="configuration">
    <template #footer><SlotPlaceholder>footer</SlotPlaceholder></template>
  </ApiReference>
</template>
