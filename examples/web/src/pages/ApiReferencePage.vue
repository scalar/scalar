<script setup lang="ts">
import {
  ApiReferenceLayout,
  useReactiveSpec,
  type ApiReferenceConfiguration,
} from '@scalar/api-reference'
import { computed, onMounted, reactive, ref, watch } from 'vue'

import DevReferencesOptions from '../components/DevReferencesOptions.vue'
import DevToolbar from '../components/DevToolbar.vue'
import MonacoEditor from '../components/MonacoEditor.vue'
import SlotPlaceholder from '../components/SlotPlaceholder.vue'

const content = ref('')

const configuration = reactive<ApiReferenceConfiguration>({
  theme: 'default',
  proxyUrl: import.meta.env.VITE_REQUEST_PROXY_URL,
  isEditable: false,
  showSidebar: true,
  layout: 'modern',
  spec: { content },
  // authentication: {
  //   // The OpenAPI file has keys for all security schemes:
  //   // Which one should be used by default?
  //   preferredSecurityScheme: 'my_custom_security_scheme',
  //   // The `my_custom_security_scheme` security scheme is of type `apiKey`, so prefill the token:
  //   apiKey: {
  //     token: 'super-secret-token',
  //   },
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
    document.body.classList.toggle('dark-mode', !!isDark)
    document.body.classList.toggle('light-mode', !isDark)
  },
)

const { parsedSpec } = useReactiveSpec({
  proxyUrl: () => configuration.proxyUrl ?? configuration.proxy ?? '',
  specConfig: () => ({
    content: content.value,
  }),
})
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
