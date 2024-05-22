<script setup lang="ts">
import {
  ApiReferenceEditor,
  type ReferenceConfiguration,
} from '@scalar/api-reference-editor'
import content from '@scalar/galaxy/latest.yaml?raw'
import { reactive } from 'vue'

import SlotPlaceholder from '../components/SlotPlaceholder.vue'

const configuration = reactive<ReferenceConfiguration>({
  proxy: import.meta.env.VITE_REQUEST_PROXY_URL,
  isEditable: true,
  // Add path routing option
  ...(window.location.pathname.startsWith('/path-routing')
    ? {
        pathRouting: { basePath: '/path-routing' },
      }
    : {}),
  spec: {
    content,
  },
})
</script>
<template>
  <ApiReferenceEditor :configuration="configuration">
    <template #footer><SlotPlaceholder>footer</SlotPlaceholder></template>
  </ApiReferenceEditor>
</template>
