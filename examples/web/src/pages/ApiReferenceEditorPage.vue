<script setup lang="ts">
import {
  ApiReferenceEditor,
  type ReferenceConfiguration,
} from '@scalar/api-reference-editor'
import { reactive } from 'vue'

import SlotPlaceholder from '../components/SlotPlaceholder.vue'

const configuration = reactive<ReferenceConfiguration>({
  theme: 'default',
  proxy: import.meta.env.VITE_REQUEST_PROXY_URL,
  isEditable: true,
})
</script>
<template>
  <ApiReferenceEditor
    :configuration="configuration"
    @changeTheme="configuration.theme = $event">
    <template #footer><SlotPlaceholder>footer</SlotPlaceholder></template>
  </ApiReferenceEditor>
</template>
