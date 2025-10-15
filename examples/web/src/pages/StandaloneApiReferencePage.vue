<script setup lang="ts">
import { ApiReference } from '@scalar/api-reference'
import { apiReferenceConfigurationSchema } from '@scalar/types/api-reference'
import { ref } from 'vue'

// Import the new spec files
import freeSpecContent from '../../../../defillama-openapi-free.json'
import proSpecContent from '../../../../defillama-openapi-pro.json'
import ApiKeyInput from '../components/ApiKeyInput.vue'
import SlotPlaceholder from '../components/SlotPlaceholder.vue'

// Create a deep copy of the spec to avoid mutating the original
const getUpdatedSpec = (baseUrl: string) => {
  if (baseUrl === 'https://pro-api.llama.fi') {
    const spec = JSON.parse(JSON.stringify(proSpecContent))
    if (!spec.servers) {
      spec.servers = [{ url: baseUrl }]
    }
    return spec
  }

  // Free plan: merge free spec with x-api-plan-only endpoints from pro spec
  const freeSpec = JSON.parse(JSON.stringify(freeSpecContent))
  const proSpec = JSON.parse(JSON.stringify(proSpecContent))

  // Add API-Plan-only endpoints to the free spec
  for (const path in proSpec.paths) {
    for (const method in proSpec.paths[path]) {
      if (proSpec.paths[path][method]['x-api-plan-only']) {
        if (!freeSpec.paths[path]) {
          freeSpec.paths[path] = {}
        }

        const proOperation = proSpec.paths[path][method]

        // If the pro operation doesn't have its own server, use the pro spec's global server
        if (!proOperation.servers && proSpec.servers) {
          proOperation.servers = proSpec.servers
        }
        freeSpec.paths[path][method] = proOperation
      }
    }
  }

  if (!freeSpec.servers) {
    freeSpec.servers = [{ url: baseUrl }]
  }
  return freeSpec
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
    <ApiReference
      :configuration="configuration"
      :key="currentBaseUrl">
      <template #footer><SlotPlaceholder>footer</SlotPlaceholder></template>
    </ApiReference>
  </div>
</template>

<style scoped>
.standalone-api-reference-page {
  padding: 1rem;
}
</style>
