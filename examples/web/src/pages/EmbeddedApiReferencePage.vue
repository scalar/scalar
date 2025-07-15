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
  <div class="main">
    <h1>This is my super duper web application</h1>
    <ApiKeyInput />
    <div class="container">
      <ApiReference :configuration="configuration">
        <template #footer><SlotPlaceholder>footer</SlotPlaceholder></template>
      </ApiReference>
    </div>
  </div>
</template>
<style scoped>
.main {
  display: flex;
  flex-direction: column;

  font-family: sans-serif;
  box-sizing: border-box;

  padding: 2rem;
  width: 100vw;
  height: 100vh;
}
.container {
  flex: 1;
  overflow: auto;
  border: 1px solid #000;
  border-radius: 3px;
}
</style>
