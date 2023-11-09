<script setup lang="ts">
import {
  ApiReferenceBase,
  type ReferenceConfiguration,
} from '@scalar/api-reference'
import { reactive } from 'vue'

import DevToolbar from '../components/DevToolbar.vue'
import SlotPlaceholder from '../components/SlotPlaceholder.vue'

const configuration = reactive<ReferenceConfiguration>({
  theme: 'default',
  proxy: 'http://localhost:5051',
  isEditable: true,
  spec: {
    url: 'https://raw.githubusercontent.com/outline/openapi/main/spec3.json',
  },
  tabs: {
    initialContent: 'Swagger Editor',
  },
})
</script>
<template>
  <DevToolbar
    :modelValue="configuration"
    @update:modelValue="
      (newConfiguration) => Object.assign(configuration, newConfiguration)
    " />
  <ApiReferenceBase :configuration="configuration">
    <template #sidebar-start>
      <SlotPlaceholder>sidebar-start</SlotPlaceholder>
    </template>
    <template #sidebar-end>
      <SlotPlaceholder>sidebar-end</SlotPlaceholder>
    </template>
    <template #header>
      <SlotPlaceholder>header</SlotPlaceholder>
    </template>
    <template #footer>
      <SlotPlaceholder>footer</SlotPlaceholder>
    </template>
  </ApiReferenceBase>
</template>
