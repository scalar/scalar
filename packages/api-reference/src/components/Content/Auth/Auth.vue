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
import type { WorkspaceDocument } from '@scalar/workspace-store/schemas'
import type { XScalarEnvironment } from '@scalar/workspace-store/schemas/extensions/document/x-scalar-environments'
import type { ServerObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { computed } from 'vue'

const {
  document,
  environment,
  eventBus,
  persistAuth,
  proxyUrl,
  selectedServer,
} = defineProps<{
  document: WorkspaceDocument
  environment: XScalarEnvironment
  eventBus: WorkspaceEventBus
  selectedServer: ServerObject | null
  persistAuth: boolean
  proxyUrl: string | null
}>()

/** Compute what the security requirements should be for an operation */
const securityRequirements = computed(() =>
  getSecurityRequirements(document, null),
)

/** Select the selected security for the operation or document */
const selectedSecurity = computed(() =>
  getSelectedSecurity(document, null, securityRequirements.value),
)
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
    :securityRequirements
    :securitySchemes="document?.components?.securitySchemes ?? {}"
    :selectedSecurity
    :server="selectedServer"
    title="Authentication" />
</template>
