<script setup lang="ts">
import {
  ApiReferenceLayout,
  type ReferenceConfiguration,
  type Spec,
  parse,
} from '@scalar/api-reference'
import { asyncComputed } from '@vueuse/core'
import { computed, onMounted, reactive, ref, watch } from 'vue'

import DevReferencesOptions from '../components/DevReferencesOptions.vue'
import DevToolbar from '../components/DevToolbar.vue'
import MonacoEditor from '../components/MonacoEditor.vue'
import SlotPlaceholder from '../components/SlotPlaceholder.vue'
import { emptySpecGenerator } from '../fixtures/emptySpec'

const content = ref('')

const configuration = reactive<ReferenceConfiguration>({
  theme: 'default',
  proxy: import.meta.env.VITE_REQUEST_PROXY_URL,
  isEditable: true,
  showSidebar: true,
  layout: 'modern',
  spec: { content },
  // authentication: {
  //   preferredSecurityScheme: 'petstore_auth',
  //   oAuth2: {
  //     clientId: 'foobar123',
  //     scopes: ['read:pets', 'write:pets'],
  //   },
  //   // preferredSecurityScheme: 'api_key',
  //   // apiKey: {
  //   //   token: 'super-secret-token',
  //   // },
  // },
})

onMounted(() => {
  content.value = window.localStorage?.getItem('api-reference-content') ?? ''
})

watch(
  content,
  () => window.localStorage?.setItem('api-reference-content', content.value),
  { deep: true },
)

const configProxy = computed({
  get: () => configuration,
  set: (v) => Object.assign(configuration, v),
})

watch(
  () => configuration.darkMode,
  (isDark) => {
    document.body.classList.toggle('dark-mode', isDark)
    document.body.classList.toggle('light-mode', !isDark)
  },
)

const parsedSpec = asyncComputed(
  async () =>
    parse(content.value)
      .then((validSpec) => {
        // Some specs don’t have servers, make sure they are defined
        return {
          servers: [],
          ...validSpec,
        } as Spec
      })
      .catch((error) => {
        console.warn(error)
        return emptySpecGenerator()
      }),
  emptySpecGenerator(),
)
</script>
<template>
  <ApiReferenceLayout
    :configuration="configuration"
    :parsedSpec="parsedSpec"
    :rawSpec="content"
    @changeTheme="configuration.theme = $event.id"
    @updateContent="(v) => (content = v)">
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
