<script setup lang="ts">
import { getApiKeyValue } from '@scalar/api-client'
import { ApiReference } from '@scalar/api-reference'
import { apiReferenceConfigurationSchema } from '@scalar/types/api-reference'
import { reactive, watch } from 'vue'

// Import the spec.json file
import specContent from '../../spec.json'
import ApiKeyInput from '../components/ApiKeyInput.vue'

const configuration = reactive(
  apiReferenceConfigurationSchema.parse({
    theme: 'default',
    proxyUrl: import.meta.env.VITE_REQUEST_PROXY_URL,
    isEditable: false,
    layout: 'classic',
    content: specContent,
  }),
)

// Watch for API key changes and update configuration
watch(
  () => getApiKeyValue('default'),
  (apiKey) => {
    // Update configuration when API key changes
    configuration.apiKey = apiKey || undefined
  },
  { immediate: true },
)
</script>
<template>
  <div class="classic-api-reference-page">
    <ApiKeyInput />
    <ApiReference :configuration="configuration" />
  </div>
</template>

<style scoped>
.classic-api-reference-page {
  padding: 1rem;
}
</style>
