<script setup lang="ts">
import {
  ApiReferenceLayout,
  type ApiReferenceConfiguration,
} from '@scalar/api-reference'
import { useColorMode } from '@scalar/use-hooks/useColorMode'
import { computed, onMounted, reactive, ref, watch } from 'vue'

// Import the spec.json file
import specContent from '../../spec.json'
import ApiKeyInput from '../components/ApiKeyInput.vue'
import DevReferencesOptions from '../components/DevReferencesOptions.vue'
import DevToolbar from '../components/DevToolbar.vue'
import MonacoEditor from '../components/MonacoEditor.vue'
import SlotPlaceholder from '../components/SlotPlaceholder.vue'
import { getApiKeyValue } from '../utils/api-key-helper'

const content = ref('')

const configuration = reactive<Partial<ApiReferenceConfiguration>>({
  theme: 'default',
  proxyUrl: import.meta.env.VITE_REQUEST_PROXY_URL,
  isEditable: false,
  showSidebar: true,
  layout: 'modern',
  content,
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
  // Use spec.json as default content if nothing is saved in localStorage
  const savedContent = window.localStorage?.getItem('api-reference-content')
  content.value = savedContent || JSON.stringify(specContent, null, 2)
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

// Watch for API key changes and update configuration
watch(
  () => getApiKeyValue(),
  (apiKey) => {
    // Update configuration when API key changes
    // This ensures the client can access the API key for requests
    configuration.apiKey = apiKey || undefined
  },
  { immediate: true },
)
</script>
<template>
  <div class="api-reference-page">
    <ApiKeyInput />
    <ApiReferenceLayout
      :isDark="isDarkMode"
      @toggleDarkMode="() => toggleColorMode()"
      :configuration="configuration"
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
  </div>
</template>

<style scoped>
.api-reference-page {
  padding: 1rem;
}
</style>
