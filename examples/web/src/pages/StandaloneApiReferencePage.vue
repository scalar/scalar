<script setup lang="ts">
import { ApiReference } from '@scalar/api-reference'
import { apiReferenceConfigurationSchema } from '@scalar/types/api-reference'
import { ref } from 'vue'

// Import the defillama-openapi.json file
import specContent from '../../../../defillama-openapi.json'
import ApiKeyInput from '../components/ApiKeyInput.vue'
import SlotPlaceholder from '../components/SlotPlaceholder.vue'

// Create a deep copy of the spec to avoid mutating the original
const getUpdatedSpec = (baseUrl: string) => {
  const spec = JSON.parse(JSON.stringify(specContent))
  
  // Update the base server URL
  spec.servers = [{
    url: baseUrl
  }]
  
  return spec
}

// Track the current base URL to prevent unnecessary reloads
const currentBaseUrl = ref<string>('https://api.llama.fi')

const configuration = ref(
  apiReferenceConfigurationSchema.parse({
    isEditable: false,
    // Add path routing option
    ...(window.location.pathname.startsWith('/path-routing')
      ? {
          pathRouting: { basePath: '/path-routing' },
        }
      : {}),
    content: getUpdatedSpec(currentBaseUrl.value),
  }),
)

// Handle API key changes from the input component
const handleApiKeyChange = (apiKey: string | null) => {
  const newBaseUrl = apiKey ? 'https://pro-api.llama.fi' : 'https://api.llama.fi'
  
  // Only update if the base URL would actually change
  if (currentBaseUrl.value !== newBaseUrl) {
    currentBaseUrl.value = newBaseUrl
    configuration.value = apiReferenceConfigurationSchema.parse({
      ...configuration.value,
      content: getUpdatedSpec(newBaseUrl),
    })
  }
}
</script>

<template>
  <div class="standalone-api-reference-page">
    <ApiKeyInput @api-key-change="handleApiKeyChange" />
    <ApiReference :configuration="configuration">
      <template #footer><SlotPlaceholder>footer</SlotPlaceholder></template>
    </ApiReference>
  </div>
</template>

<style scoped>
.standalone-api-reference-page {
  padding: 1rem;
}
</style>
