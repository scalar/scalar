<script setup lang="ts">
import { ApiReference } from '@scalar/api-reference'
import { apiReferenceConfigurationSchema } from '@scalar/types/api-reference'
import { reactive, watch } from 'vue'

// Import the spec.json file
import specContent from '../../spec.json'
import ApiKeyInput from '../components/ApiKeyInput.vue'
import SlotPlaceholder from '../components/SlotPlaceholder.vue'
import { getApiKeyValue } from '../utils/api-key-helper'

const configuration = reactive(
  apiReferenceConfigurationSchema.parse({
    proxyUrl: import.meta.env.VITE_REQUEST_PROXY_URL,
    isEditable: false,
    // Add path routing option
    ...(window.location.pathname.startsWith('/path-routing')
      ? {
          pathRouting: { basePath: '/path-routing' },
        }
      : {}),
    content: specContent,
  }),
)

// Watch for API key changes and update configuration
watch(
  () => getApiKeyValue(),
  (apiKey) => {
    // Update configuration when API key changes
    configuration.apiKey = apiKey || undefined
  },
  { immediate: true },
)
</script>
<template>
  <div class="standalone-api-reference-page">
    <ApiKeyInput />
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
