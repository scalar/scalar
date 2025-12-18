<script lang="ts">
/**
 * References wrapper around the AuthSelector block,
 * performs some logic to make it work in the API Reference.
 */
export default {}
</script>

<script lang="ts" setup>
import { AuthSelector } from '@scalar/api-client/v2/blocks/scalar-auth-selector-block'
import { getSelectedServer } from '@scalar/api-client/v2/features/operation'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import type { WorkspaceDocument } from '@scalar/workspace-store/schemas'
import type { XScalarEnvironment } from '@scalar/workspace-store/schemas/extensions/document/x-scalar-environments'
import { computed } from 'vue'

const { document, environment, eventBus, persistAuth, proxyUrl } = defineProps<{
  document: WorkspaceDocument
  environment: XScalarEnvironment
  eventBus: WorkspaceEventBus
  persistAuth: boolean
  proxyUrl: string | null
}>()

/** Compute the selected server for the document only for now */
const selectedServer = computed(() => getSelectedServer(document))

// proxyUrl: string
//   securityRequirements: OpenApiDocument['security']
//   securitySchemes: NonNullable<OpenApiDocument['components']>['securitySchemes']
//   selectedSecurity: OpenApiDocument['x-scalar-selected-security']
</script>

<template>
  <AuthSelector
    v-if="Object.keys(document?.components?.securitySchemes ?? {}).length"
    :environment
    :eventBus
    isReadOnly
    isStatic
    layout="reference"
    :meta="{ type: 'document' }"
    :persistAuth="persistAuth"
    :proxyUrl="proxyUrl ?? ''"
    :server="selectedServer"
    title="Authentication" />
</template>
