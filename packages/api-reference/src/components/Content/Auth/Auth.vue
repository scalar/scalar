<script lang="ts">
/**
 * API Reference wrapper around the AuthSelector block.
 * Computes security requirements and selected security to make it work in the API Reference.
 */
export default {}
</script>

<script lang="ts" setup>
import { AuthSelector } from '@scalar/api-client/v2/blocks/scalar-auth-selector-block'
import {
  getSecurityRequirements,
  getSelectedSecurity,
} from '@scalar/api-client/v2/features/operation'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import type { XScalarEnvironment } from '@scalar/workspace-store/schemas/extensions/document/x-scalar-environments'
import type {
  OpenApiDocument,
  ServerObject,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { computed } from 'vue'

const {
  documentSecurity,
  documentSelectedSecurity,
  environment,
  eventBus,
  persistAuth,
  proxyUrl,
  securitySchemes,
  selectedServer,
} = defineProps<{
  documentSecurity: OpenApiDocument['security']
  documentSelectedSecurity: OpenApiDocument['x-scalar-selected-security']
  environment: XScalarEnvironment
  eventBus: WorkspaceEventBus
  persistAuth: boolean
  proxyUrl: string | null
  securitySchemes: NonNullable<OpenApiDocument['components']>['securitySchemes']
  selectedServer: ServerObject | null
}>()

/** Compute what the security requirements should be for an operation */
const securityRequirements = computed(() =>
  getSecurityRequirements(documentSecurity),
)

/** Select the selected security for the operation or document */
const selectedSecurity = computed(() =>
  getSelectedSecurity(
    documentSelectedSecurity,
    undefined,
    securityRequirements.value,
  ),
)
</script>

<template>
  <AuthSelector
    v-if="Object.keys(securitySchemes ?? {}).length"
    :environment
    :eventBus
    isReadOnly
    isStatic
    layout="reference"
    :meta="{ type: 'document' }"
    :persistAuth="persistAuth"
    :proxyUrl="proxyUrl ?? ''"
    :securityRequirements
    :securitySchemes
    :selectedSecurity
    :server="selectedServer"
    title="Authentication" />
</template>
