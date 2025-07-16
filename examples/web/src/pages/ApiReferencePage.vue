<script setup lang="ts">
import {
  getApiKey,
  getApiKeyValue,
  isApiKeyEnabled,
  saveApiKey,
} from '@scalar/api-client'
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

const content = ref('')

// Helper function to get API key value for the default workspace
const getApiKeyForDefaultWorkspace = () => {
  return getApiKeyValue('default')
}

const configuration = reactive<Partial<ApiReferenceConfiguration>>({
  theme: 'default',
  isEditable: false,
  showSidebar: true,
  layout: 'modern',
  content,
  hideClientButton: false, // Ensure API client is visible
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
  () => getApiKeyForDefaultWorkspace(),
  (apiKey) => {
    // Update configuration when API key changes
    // This ensures the client can access the API key for requests
    // Note: The API key is managed by the API key manager and automatically injected into requests
  },
  { immediate: true },
)
</script>
<template>
  <div class="api-reference-page">
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
        <div class="sidebar-branding">
          <img
            src="https://defillama.com/defillama-press-kit/defi/PNG/defillama.png"
            alt="DeFiLlama"
            class="defillama-logo" />
        </div>
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
        <div class="api-settings-bar">
          <ApiKeyInput />
          <TierConfigurationInput />
        </div>
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
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: var(--scalar-background-1);
}

.api-settings-bar {
  display: flex;
  flex-direction: column;
  gap: var(--scalar-spacing-4);
  padding: var(--scalar-spacing-4);
  border-bottom: var(--scalar-border-width) solid var(--scalar-border-color);
  background: var(--scalar-background-1);
  position: sticky;
  top: 0;
  z-index: 10;
  margin-bottom: var(--scalar-spacing-4);
  border-radius: 0;
}

@media (min-width: 768px) {
  .api-settings-bar {
    flex-direction: row;
    align-items: flex-start;
    gap: var(--scalar-spacing-6);
  }
}

.sidebar-branding {
  padding: var(--scalar-spacing-4) var(--scalar-spacing-3);
  border-bottom: var(--scalar-border-width) solid var(--scalar-border-color);
  background: var(--scalar-sidebar-background-1, var(--scalar-background-1));
  display: flex;
  justify-content: center;
  align-items: center;
}

.defillama-logo {
  height: 32px;
  width: auto;
  max-width: 120px;
  object-fit: contain;
  filter: brightness(0.9);
  transition: all 0.15s ease;
}

.defillama-logo:hover {
  filter: brightness(1);
  transform: scale(1.02);
}
</style>
