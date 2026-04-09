<script setup lang="ts">
import { AuthSelector } from '@scalar/api-client/v2/blocks/scalar-auth-selector-block'
import type { ApiReferenceConfigurationRaw } from '@scalar/types/api-reference'
import type { AuthStore } from '@scalar/workspace-store/entities/auth'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import {
  getSecurityRequirements,
  getSelectedSecurity,
  type MergedSecuritySchemes,
} from '@scalar/workspace-store/request-example'
import type { XScalarEnvironment } from '@scalar/workspace-store/schemas/extensions/document/x-scalar-environments'
import type { ServerObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import type { WorkspaceDocument } from '@scalar/workspace-store/schemas/workspace'
import { computed } from 'vue'

const { document, environment, eventBus, options, securitySchemes, authStore } =
  defineProps<{
    options: Pick<
      ApiReferenceConfigurationRaw,
      'authentication' | 'persistAuth' | 'proxyUrl'
    >
    authStore: AuthStore
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

/** Grab the selected security for the document from the auth store */
const documentSelectedSecurity = computed(() =>
  authStore.getAuthSelectedSchemas({
    type: 'document',
    documentName: document?.['x-scalar-navigation']?.name ?? '',
  }),
)

/** The selected security keys for the document */
const selectedSecurity = computed(() =>
  getSelectedSecurity(
    documentSelectedSecurity.value,
    undefined,
    securityRequirements.value,
    securitySchemes,
    options.authentication?.preferredSecurityScheme,
  ),
)
</script>
<template>
  <AuthSelector
    v-if="Object.keys(securitySchemes).length"
    :createAnySecurityScheme="
      options.authentication?.createAnySecurityScheme ?? false
    "
    :environment
    :eventBus
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
