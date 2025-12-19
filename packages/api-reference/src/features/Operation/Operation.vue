<script lang="ts" setup>
import { getSecuritySchemes } from '@scalar/api-client/v2/blocks/operation-block'
import type { ClientOptionGroup } from '@scalar/api-client/v2/blocks/operation-code-sample'
import type { HttpMethod } from '@scalar/helpers/http/http-methods'
import type { ApiReferenceConfiguration } from '@scalar/types/api-reference'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type {
  OpenApiDocument,
  PathItemObject,
  ServerObject,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { computed } from 'vue'

import { combineParams } from '@/features/Operation/helpers/combine-params'

import { getFirstServer } from './helpers/get-first-server'
import ClassicLayout from './layouts/ClassicLayout.vue'
import ModernLayout from './layouts/ModernLayout.vue'

const {
  server,
  pathValue,
  config,
  isWebhook,
  document,
  method,
  selectedSecurity,
  clientOptions,
} = defineProps<{
  id: string
  method: HttpMethod
  /** The configuration object */
  config: ApiReferenceConfiguration
  /** Document object */
  document: OpenApiDocument
  /** Key of the operations path in the document.paths object */
  path: string
  /** OpenAPI path object that will include the operation */
  pathValue: PathItemObject | undefined
  /** Currently selected security for the document */
  selectedSecurity: OpenApiDocument['x-scalar-selected-security']
  /** Currently selected server for the document */
  server: ServerObject | null
  /** The http client options for the dropdown */
  clientOptions: ClientOptionGroup[]
  isCollapsed: boolean
  isWebhook: boolean
  selectedClient: WorkspaceStore['workspace']['x-scalar-default-client']
  eventBus: WorkspaceEventBus
}>()

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

/** Compute what the security requirements should be for an operation */
// TODO this will later be used to show that this operation requires auth
// const oprationSecurityRequirements = computed(() =>
//   getSecurityRequirements(document.security, operation.value?.security),
// )

/** Selected security schemes in scheme form */
const selectedSecuritySchemes = computed(() =>
  getSecuritySchemes(
    document.components?.securitySchemes ?? {},
    selectedSecurity?.selectedSchemes ?? [],
  ),
)

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

/** Cache the operation options in a computed */
const options = computed(() => ({
  isWebhook,
  showOperationId: config.showOperationId,
  hideTestRequestButton: config.hideTestRequestButton,
  expandAllResponses: config.expandAllResponses,
  clientOptions,
  orderRequiredPropertiesFirst: config.orderRequiredPropertiesFirst,
  orderSchemaPropertiesBy: config.orderSchemaPropertiesBy,
}))
</script>

<template>
  <template v-if="operation">
    <ClassicLayout
      v-if="config.layout === 'classic'"
      :id="id"
      :eventBus
      :isCollapsed
      :method
      :operation
      :options
      :path
      :selectedClient
      :selectedSecuritySchemes
      :selectedServer />
    <ModernLayout
      v-else
      :id="id"
      :eventBus="eventBus"
      :method="method"
      :operation
      :options
      :path
      :selectedClient
      :selectedSecuritySchemes
      :selectedServer />
  </template>
</template>
