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
  <ApiReferenceBase :configuration="configuration">
    <template #header>
      <DevToolbar
        :modelValue="configuration"
        @update:modelValue="
          (newConfiguration) => Object.assign(configuration, newConfiguration)
        " />
    </template>
    <template #sidebar-start>
      <SlotPlaceholder>sidebar-start</SlotPlaceholder>
    </template>
    <template #sidebar-end>
      <SlotPlaceholder>sidebar-end</SlotPlaceholder>
    </template>
    <template #content-start>
      <SlotPlaceholder>content-start</SlotPlaceholder>
    </template>
    <template #content-end>
      <SlotPlaceholder>content-end</SlotPlaceholder>
    </template>
  </ApiReferenceBase>
</template>
