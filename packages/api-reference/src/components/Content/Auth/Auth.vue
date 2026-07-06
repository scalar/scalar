<script setup lang="ts">
import { AuthSelector } from '@scalar/api-client/blocks/scalar-auth-selector-block'
import type { ApiReferenceConfigurationRaw } from '@scalar/types/api-reference'
import { getAsyncApiDocumentSecurityRequirements } from '@scalar/workspace-store/channel-example'
import type { AuthStore } from '@scalar/workspace-store/entities/auth'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import {
  getSecurityRequirements,
  getSelectedSecurity,
  type MergedSecuritySchemes,
} from '@scalar/workspace-store/request-example'
import type { XScalarEnvironment } from '@scalar/workspace-store/schemas/extensions/document/x-scalar-environments'
import {
  getDocumentType,
  isAsyncApiDocument,
  isOpenApiDocument,
} from '@scalar/workspace-store/schemas/type-guards'
import type { ServerObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import type { WorkspaceDocument } from '@scalar/workspace-store/schemas/workspace'
import { computed } from 'vue'

import { useLocalization } from '@/features/localization'

const { document, environment, eventBus, options, securitySchemes, authStore } =
  defineProps<{
    options: Pick<
      ApiReferenceConfigurationRaw,
      'authentication' | 'oauth2RedirectUri' | 'persistAuth' | 'proxyUrl'
    >
    authStore: AuthStore
    document: WorkspaceDocument | undefined
    eventBus: WorkspaceEventBus
    securitySchemes: MergedSecuritySchemes
    selectedServer: ServerObject | null
    environment: XScalarEnvironment
  }>()
const { translate } = useLocalization()

/**
 * Document name used to scope auth selections in the store. Both OpenAPI and AsyncAPI
 * documents persist it on `x-scalar-navigation.name`.
 */
const documentName = computed(() => {
  if (isOpenApiDocument(document) || isAsyncApiDocument(document)) {
    return document['x-scalar-navigation']?.name ?? ''
  }
  return ''
})

/** Document type used to label the missing-type warning (OpenAPI vs AsyncAPI). */
const documentType = computed(() => getDocumentType(document))

/**
 * Compute what the security requirements should be for the document.
 *
 * AsyncAPI has no root-level `security`, so document-wide auth is derived from the union of
 * every server's security requirements.
 */
const securityRequirements = computed(() => {
  if (isAsyncApiDocument(document)) {
    return getAsyncApiDocumentSecurityRequirements(document)
  }
  return getSecurityRequirements(
    isOpenApiDocument(document) ? document.security : undefined,
  )
})

/** Grab the selected security for the document from the auth store */
const documentSelectedSecurity = computed(() =>
  authStore.getAuthSelectedSchemas({
    type: 'document',
    documentName: documentName.value,
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
    :canDeleteSchemes="false"
    :createAnySecurityScheme="
      options.authentication?.createAnySecurityScheme ?? false
    "
    :documentType
    :environment
    :eventBus
    isStatic
    layout="reference"
    :meta="{ type: 'document' }"
    :options="{ oauth2RedirectUri: options.oauth2RedirectUri }"
    :persistAuth="options.persistAuth"
    :proxyUrl="options.proxyUrl ?? ''"
    :securityRequirements
    :securitySchemes
    :selectedSecurity
    :server="selectedServer"
    :title="translate('authentication.title')" />
</template>
