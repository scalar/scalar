<script setup lang="ts">
import {
  ApiReference,
  type ReferenceConfiguration,
} from '@scalar/api-reference'
import { reactive } from 'vue'

import SlotPlaceholder from '../components/SlotPlaceholder.vue'

const configuration = reactive<ReferenceConfiguration>({
  theme: 'default',
  proxy: 'http://localhost:5051',
  isEditable: false,
  spec: {
    url: 'https://petstore3.swagger.io/api/v3/openapi.json',
  },

  tabs: {
    initialContent: 'Swagger Editor',
  },
})
</script>
<template>
  <ApiReference :configuration="configuration">
    <template #footer><SlotPlaceholder>footer</SlotPlaceholder></template>
  </ApiReference>
</template>
