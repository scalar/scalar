<script setup lang="ts">
import type { AnyApiReferenceConfiguration } from '@scalar/types/api-reference'
import { createWorkspaceStore } from '@scalar/workspace-store/client'

import ApiReferenceWorkspace from '@/v2/ApiReferenceWorkspace.vue'

defineProps<{
  /**
   * Configuration for the API reference.
   * Can be a single configuration or an array of configurations for multiple documents.
   */
  configuration?: AnyApiReferenceConfiguration
}>()

/**
 * Initializes the new client workspace store.
 *
 * TODO: Reference config should set the appropriate workspace properties
 */
const workspaceStore = createWorkspaceStore()
</script>

<template>
  <ApiReferenceWorkspace
    :getWorkspaceStore="() => workspaceStore"
    :configuration="configuration" />
</template>
