<script setup lang="ts">
import {
  AuthSelector,
  type MergedSecuritySchemes,
} from '@scalar/api-client/v2/blocks/scalar-auth-selector-block'
import {
  getSecurityRequirements,
  getSelectedSecurity,
} from '@scalar/api-client/v2/features/operation'
import type { ApiReferenceConfigurationRaw } from '@scalar/types/api-reference'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import { unpackProxyObject } from '@scalar/workspace-store/helpers/unpack-proxy'
import type { XScalarEnvironment } from '@scalar/workspace-store/schemas/extensions/document/x-scalar-environments'
import type { ServerObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import type { WorkspaceDocument } from '@scalar/workspace-store/schemas/workspace'
import { computed, watch } from 'vue'

const { document, environment, eventBus, options } = defineProps<{
  options: Pick<ApiReferenceConfigurationRaw, 'persistAuth' | 'proxyUrl'>
  document: WorkspaceDocument | undefined
  eventBus: WorkspaceEventBus
  securitySchemes: MergedSecuritySchemes
  selectedServer: ServerObject | null
  environment: XScalarEnvironment
}>()

/** Compute what the security requirements should be for the document */
const securityRequirements = computed(() =>
  getSecurityRequirements(document?.security),
)

/** The selected security keys for the document */
const selectedSecurity = computed(() =>
  getSelectedSecurity(
    document?.['x-scalar-selected-security'],
    undefined,
    securityRequirements.value,
  ),
)

// We set the initial security on the document to the default if it doesn't exist
watch(
  () => document?.['x-scalar-selected-security'],
  (documentSelectedSecurity) => {
    if (
      typeof documentSelectedSecurity !== 'undefined' ||
      !securityRequirements.value.length
    ) {
      return
    }

    eventBus.emit('auth:update:selected-security-schemes', {
      selectedRequirements: unpackProxyObject(
        securityRequirements.value.slice(0, 1),
        { depth: 1 },
      ),
      newSchemes: [],
      meta: { type: 'document' },
    })
  },
  { immediate: true },
)
</script>
<template>
  <AuthSelector
    v-if="Object.keys(securitySchemes).length"
    :environment
    :eventBus
    isReadOnly
    isStatic
    layout="reference"
    :meta="{ type: 'document' }"
    :persistAuth="options.persistAuth"
    :proxyUrl="options.proxyUrl ?? ''"
    :securityRequirements
    :securitySchemes
    :selectedSecurity
    :server="selectedServer"
    title="Authentication" />
</template>
