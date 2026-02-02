<script lang="ts">
/**
 * References Operation "block"
 */
export default {}

export type OperationProps = {
  id: string
  method: HttpMethod
  /** The subset of the configuration object required for the operation component */
  options: Pick<
    ApiReferenceConfigurationRaw,
    | 'expandAllResponses'
    | 'hideTestRequestButton'
    | 'layout'
    | 'orderRequiredPropertiesFirst'
    | 'orderSchemaPropertiesBy'
    | 'showOperationId'
  >
  /** Document object */
  document: OpenApiDocument
  /** Key of the operations path in the document.paths object */
  path: string
  /** OpenAPI path object that will include the operation */
  pathValue: PathItemObject | undefined
  /** Currently selected server for the document */
  server: ServerObject | null
  /** The merged security schemes for the document and the authentication configuration */
  securitySchemes: MergedSecuritySchemes
  /** The http client options for the dropdown */
  clientOptions: ClientOptionGroup[]
  /** Whether the Classic layout operation is collapsed */
  isCollapsed: boolean
  /** Whether the operation is a webhook */
  isWebhook: boolean
  /** The currently selected client for the document */
  selectedClient: WorkspaceStore['workspace']['x-scalar-default-client']
  /** The event bus */
  eventBus: WorkspaceEventBus
  /** The auth store */
  authStore: AuthStore
}
</script>

<script lang="ts" setup>
import type { ClientOptionGroup } from '@scalar/api-client/v2/blocks/operation-code-sample'
import type { MergedSecuritySchemes } from '@scalar/api-client/v2/blocks/scalar-auth-selector-block'
import { combineParams } from '@scalar/api-client/v2/features/operation'
import type { HttpMethod } from '@scalar/helpers/http/http-methods'
import type { ApiReferenceConfigurationRaw } from '@scalar/types/api-reference'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import type { AuthStore } from '@scalar/workspace-store/entities/auth'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type {
  OpenApiDocument,
  PathItemObject,
  ServerObject,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { computed } from 'vue'

import { filterSelectedSecurity } from '@/features/Operation/helpers/filter-selected-security'

import { getFirstServer } from './helpers/get-first-server'
import ClassicLayout from './layouts/ClassicLayout.vue'
import ModernLayout from './layouts/ModernLayout.vue'

const {
  authStore,
  clientOptions,
  document,
  eventBus,
  isCollapsed,
  isWebhook,
  method,
  options,
  path,
  pathValue,
  securitySchemes,
  server,
} = defineProps<OperationProps>()

/**
 * Operation from the new workspace store, ensure we are de-reference
 *
 * Also adds in params from the pathItemObject
 */
const operation = computed(() => {
  const entity = getResolvedRef(pathValue?.[method])

  if (!entity) {
    return null
  }

  // Combine params from the pathItem and the operation
  const parameters = combineParams(pathValue?.parameters, entity.parameters)
  return { ...entity, parameters }
})

/**
 * Determine the effective server for the code examples.
 */
const selectedServer = computed<ServerObject | null>(() =>
  getFirstServer(
    // 1) Operation
    operation.value?.servers ?? null,
    // 2) Path Item
    pathValue?.servers ?? null,
    // 3) Document
    server,
  ),
)

/** We must ensure the selected security schemes are required on this operation */
const selectedSecuritySchemes = computed(() =>
  filterSelectedSecurity(
    document,
    operation.value,
    authStore.getAuthSelectedSchemas({
      type: 'document',
      documentName: document?.['x-scalar-navigation']?.name ?? '',
    }),
    authStore.getAuthSelectedSchemas({
      type: 'operation',
      documentName: document?.['x-scalar-navigation']?.name ?? '',
      path,
      method,
    }),
    securitySchemes,
  ),
)
</script>

<template>
  <template v-if="operation">
    <ClassicLayout
      v-if="options.layout === 'classic'"
      :id
      :clientOptions
      :eventBus
      :isCollapsed
      :isWebhook
      :method
      :operation
      :options
      :path
      :selectedClient
      :selectedSecuritySchemes
      :selectedServer />
    <ModernLayout
      v-else
      :id
      :clientOptions
      :eventBus
      :isWebhook
      :method
      :operation
      :options
      :path
      :selectedClient
      :selectedSecuritySchemes
      :selectedServer />
  </template>
</template>
