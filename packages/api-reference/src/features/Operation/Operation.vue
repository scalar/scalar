<script lang="ts" setup>
import { getSecuritySchemes } from '@scalar/api-client/v2/blocks/operation-block'
import type { ClientOptionGroup } from '@scalar/api-client/v2/blocks/operation-code-sample'
import {
  getSecurityRequirements,
  getSelectedSecurity,
} from '@scalar/api-client/v2/features/operation'
import type { HttpMethod } from '@scalar/helpers/http/http-methods'
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

const { server, pathValue, method, options } = defineProps<{
  id: string
  method: HttpMethod
  /** Key of the operations path in the document.paths object */
  path: string
  /** OpenAPI path object that will include the operation */
  pathValue: PathItemObject | undefined
  /** Currently selected server for the document */
  server: ServerObject | null
  isCollapsed: boolean
  xScalarDefaultClient: WorkspaceStore['workspace']['x-scalar-default-client']
  eventBus: WorkspaceEventBus | null

  // ---------------------------------------------
  options: {
    documentSecurity: OpenApiDocument['security']
    documentSelectedSecurity: OpenApiDocument['x-scalar-selected-security']
    securitySchemes: NonNullable<
      OpenApiDocument['components']
    >['securitySchemes']
    layout: 'classic' | 'modern'
    /** Sets some additional display properties when an operation is a webhook */
    isWebhook: boolean
    showOperationId: boolean | undefined
    hideTestRequestButton: boolean | undefined
    expandAllResponses: boolean | undefined
    clientOptions: ClientOptionGroup[]
    orderRequiredPropertiesFirst: boolean | undefined
    orderSchemaPropertiesBy: 'alpha' | 'preserve' | undefined
  }
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
const securityRequirements = computed(() =>
  getSecurityRequirements(options.documentSecurity, operation.value?.security),
)

/** Selected security schemes for the operation */
const selectedSecuritySchemes = computed(() => {
  const selectedSecurity = getSelectedSecurity(
    options.documentSelectedSecurity,
    operation.value?.['x-scalar-selected-security'],
    securityRequirements.value,
  )

  return getSecuritySchemes(
    options.securitySchemes,
    selectedSecurity.selectedSchemes ?? [],
  )
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
</script>

<template>
  <template v-if="operation">
    <ClassicLayout
      v-if="options?.layout === 'classic'"
      :id="id"
      :eventBus
      :isCollapsed
      :method
      :operation
      :options
      :path
      :selectedSecuritySchemes
      :selectedServer
      :xScalarDefaultClient />
    <ModernLayout
      v-else
      :id="id"
      :eventBus="eventBus"
      :method="method"
      :operation
      :options
      :path
      :selectedSecuritySchemes
      :selectedServer
      :xScalarDefaultClient />
  </template>
</template>
