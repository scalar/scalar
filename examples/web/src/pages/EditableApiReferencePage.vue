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
  isEditable: true,
})
</script>
<template>
  <ApiReference
    :configuration="configuration"
    @changeTheme="configuration.theme = $event">
    <template #footer><SlotPlaceholder>footer</SlotPlaceholder></template>
  </ApiReference>
</template>
