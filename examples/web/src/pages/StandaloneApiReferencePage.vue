<script setup lang="ts">
import {
  ApiReference,
  type ReferenceConfiguration,
} from '@scalar/api-reference'
import { reactive } from 'vue'

import content from '../../../../specifications/scalar-galaxy-3.1.json'
import SlotPlaceholder from '../components/SlotPlaceholder.vue'

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
