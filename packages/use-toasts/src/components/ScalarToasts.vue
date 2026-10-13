<script setup lang="ts">
import { defineAsyncComponent, inject } from 'vue'

import { toastContextKey } from '../hooks/useToasts'
import ScalarEmbeddedToasts from './ScalarEmbeddedToasts.vue'

// vue-sonner injects styles into document.head on import. Only load it for document-level integrations.
const ScalarLegacyToasts = defineAsyncComponent(
  () => import('./ScalarLegacyToasts.vue'),
)
const embedded = inject(toastContextKey, undefined)
</script>

<template>
  <ScalarEmbeddedToasts v-if="embedded" />
  <ScalarLegacyToasts v-else />
</template>
