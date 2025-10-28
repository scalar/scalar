<script lang="ts" setup>
import type { ClientOptionGroup } from '@scalar/api-client/v2/blocks/operation-code-sample'
import type { HttpMethod } from '@scalar/helpers/http/http-methods'
import type { Server } from '@scalar/oas-utils/entities/spec'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type {
  PathItemObject,
  SecurityRequirementObject,
  ServerObject,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { computed } from 'vue'

import { combineParams } from '@/features/Operation/helpers/combine-params'
import type { SecuritySchemeGetter } from '@/helpers/map-config-to-client-store'

import { getFirstServer } from './helpers/get-first-server'
import ClassicLayout from './layouts/ClassicLayout.vue'
import ModernLayout from './layouts/ModernLayout.vue'

const { server, pathValue, method, security, getSecurityScheme } = defineProps<{
  id: string
  method: HttpMethod
  /** Key of the operations path in the document.paths object */
  path: string
  /** OpenAPI path object that will include the operation */
  pathValue: PathItemObject | undefined
  /** Active server*/
  server: Server | undefined
  /** Document level security requirements */
  security: SecurityRequirementObject[] | undefined
  /** Temporary getter function to handle overlap with the client store */
  getSecurityScheme: SecuritySchemeGetter
  isCollapsed: boolean
  xScalarDefaultClient: WorkspaceStore['workspace']['x-scalar-default-client']
  eventBus: WorkspaceEventBus | null
  // ---------------------------------------------
  options: {
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

/**
 * TEMP
 * This still uses the client store and formats it into the new store format
 */
const selectedSecuritySchemes = computed(() =>
  getSecurityScheme(operation.value?.security, security || []),
)

/**
 * Determine the effective server for the code examples.
 */
const selectedServer = computed<ServerObject | undefined>(() =>
  getFirstServer(
    // 1) Operation
    operation.value?.servers,
    // 2) Path Item
    pathValue?.servers,
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
      :eventBus="eventBus"
      :isCollapsed="isCollapsed"
      :method="method"
      :operation="operation"
      :options="options"
      :path="path"
      :securitySchemes="selectedSecuritySchemes"
      :server="selectedServer"
      :xScalarDefaultClient="xScalarDefaultClient" />
    <ModernLayout
      v-else
      :id="id"
      :eventBus="eventBus"
      :method="method"
      :operation="operation"
      :options="options"
      :path="path"
      :securitySchemes="selectedSecuritySchemes"
      :server="selectedServer"
      :xScalarDefaultClient="xScalarDefaultClient" />
  </template>
</template>
