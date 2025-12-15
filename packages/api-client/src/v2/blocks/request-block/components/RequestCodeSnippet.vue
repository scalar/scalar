<script setup lang="ts">
import { ScalarErrorBoundary } from '@scalar/components'
import { computed } from 'vue'

import {
  generateClientOptions,
  OperationCodeSample,
} from '@/v2/blocks/operation-code-sample'

/**
 * Generate all client options for the dropdown
 */
const clientOptions = computed(
  () => null,
  // generateClientOptions(options.hiddenClients),
)
</script>

<template>
  <ScalarErrorBoundary>
    <!-- <OperationCodeSample
      :clientOptions="options.clientOptions"
      fallback
      :isWebhook="options.isWebhook"
      :method
      :operation
      :path
      :securitySchemes
      :selectedClient="xScalarDefaultClient"
      :selectedServer="server" /> -->
  </ScalarErrorBoundary>
</template>
