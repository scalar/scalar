<script setup lang="ts">
import {
  ApiReference,
  type ReferenceConfiguration,
} from '@scalar/api-reference'
import { type ThemeId } from '@scalar/themes'
import { reactive } from 'vue'

import SlotPlaceholder from '../components/SlotPlaceholder.vue'

// import preparsedContent from '../fixtures/specResult.json'

const handleUpdateContent = (content: string) => {
  window.localStorage.setItem('api-reference-content', content)
}

const configuration = reactive<ReferenceConfiguration>({
  theme: 'default',
  proxy: 'http://localhost:5051',
  isEditable: true,
  spec: {
    content: window.localStorage.getItem('api-reference-content') ?? undefined,
    // content: { openapi: '3.1.0', info: { title: 'Example' }, paths: {} },
    // content: () => {
    //   return { openapi: '3.1.0', info: { title: 'Example' }, paths: {} }
    // },
    // preparsedContent,
    // url: 'https://raw.githubusercontent.com/outline/openapi/main/spec3.json',
    // url: 'https://raw.githubusercontent.com/testimio/public-openapi/TES-14404-mobile-applications/api.yaml',
  },
  tabs: {
    initialContent: 'Swagger Editor',
  },
})
</script>

<template>
  <!-- <textarea
    v-model="spec"
    cols="30"
    rows="10" /> -->
  <ApiReference
    :configuration="configuration"
    @changeTheme="(theme: ThemeId) => (configuration.theme = theme)"
    @updateContent="handleUpdateContent">
    <template #footer>
      <SlotPlaceholder>footer</SlotPlaceholder>
    </template>
  </ApiReference>
</template>
