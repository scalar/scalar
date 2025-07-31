<script setup lang="ts">
import {
  ApiReferenceLayout,
  type ApiReferenceConfiguration,
} from '@scalar/api-reference'
import { useColorMode } from '@scalar/use-hooks/useColorMode'
import { createWorkspaceStore } from '@scalar/workspace-store/client'
import { computed, reactive, ref, watch } from 'vue'

import DevReferencesOptions from '../components/DevReferencesOptions.vue'
import DevToolbar from '../components/DevToolbar.vue'
import MonacoEditor from '../components/MonacoEditor.vue'
import SlotPlaceholder from '../components/SlotPlaceholder.vue'

const DEFAULT_CONTENT = {
  openapi: '3.1.0',
  info: {
    title: 'Hello World',
    version: '1.0.0',
  },
  paths: {
    '/': {
      get: {
        summary: 'Get the root path',
        description: 'Returns a simple message',
        responses: {
          200: {
            description: 'OK',
          },
        },
      },
    },
  },
}

const content = ref(JSON.stringify(DEFAULT_CONTENT, null, 2))

const configuration = reactive<Partial<ApiReferenceConfiguration>>({
  theme: 'default',
  proxyUrl: import.meta.env.VITE_REQUEST_PROXY_URL,
  isEditable: true,
  showSidebar: true,
  layout: 'modern',
  content: DEFAULT_CONTENT,
})

const configProxy = computed({
  get: () => configuration,
  set: (v) => Object.assign(configuration, v),
})

const { toggleColorMode, isDarkMode } = useColorMode({
  initialColorMode: configuration.darkMode ? 'dark' : undefined,
  overrideColorMode: configuration.forceDarkModeState,
})

watch(
  () => configuration.darkMode,
  (isDark) => {
    document.body.classList.toggle('dark-mode', Boolean(isDark))
    document.body.classList.toggle('light-mode', !isDark)
  },
)

const store = createWorkspaceStore()
await store.addDocument({
  name: 'default',
  document: JSON.parse(content.value),
})

// Keep the content in sync
// TODO: YAML support
watch(content, (v) => {
  configuration.content = JSON.parse(v)
  store.replaceDocument('default', JSON.parse(v))
})
</script>
<template>
  <ApiReferenceLayout
    :store="store"
    :isDark="isDarkMode"
    @toggleDarkMode="() => toggleColorMode()"
    :configuration="configuration"
    @changeTheme="configuration.theme = $event.id"
    @updateContent="(v: string) => (content = v)">
    <template #header>
      <DevToolbar>
        <DevReferencesOptions v-model="configProxy" />
      </DevToolbar>
    </template>
    <template #sidebar-start>
      <SlotPlaceholder>sidebar-start</SlotPlaceholder>
    </template>
    <template #sidebar-end>
      <SlotPlaceholder>sidebar-end</SlotPlaceholder>
    </template>
    <template #editor>
      <MonacoEditor
        v-model="content"
        :darkMode="configuration.darkMode" />
    </template>
    <template #content-start>
      <SlotPlaceholder>content-start</SlotPlaceholder>
    </template>
    <template #content-end>
      <SlotPlaceholder>content-end</SlotPlaceholder>
    </template>
    <template #footer>
      <SlotPlaceholder>footer</SlotPlaceholder>
    </template>
  </ApiReferenceLayout>
</template>
