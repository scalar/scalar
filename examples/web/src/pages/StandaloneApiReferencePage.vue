<script setup lang="ts">
import { ApiReference } from '@scalar/api-reference'
import { apiReferenceConfigurationSchema } from '@scalar/types/api-reference'
import { reactive } from 'vue'

// Import the defillama-openapi.json file
import specContent from '../../../../defillama-openapi.json'
import ApiKeyInput from '../components/ApiKeyInput.vue'
import SlotPlaceholder from '../components/SlotPlaceholder.vue'

const configuration = reactive(
  apiReferenceConfigurationSchema.parse({
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
