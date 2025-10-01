<script lang="ts" setup>
import { useWorkspace } from '@scalar/api-client/store'
import type { ClientOptionGroup } from '@scalar/api-client/v2/blocks/operation-code-sample'
import { filterSecurityRequirements } from '@scalar/api-client/views/Request/RequestSection'
import type { HttpMethod } from '@scalar/helpers/http/http-methods'
import type { Collection, Server } from '@scalar/oas-utils/entities/spec'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type {
  PathItemObject,
  SecurityRequirementObject,
  ServerObject,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { computed } from 'vue'

import { combineParams } from '@/features/Operation/helpers/combine-params'
import { convertSecurityScheme } from '@/helpers/convert-security-scheme'

import { getFirstServer } from './helpers/get-first-server'
import ClassicLayout from './layouts/ClassicLayout.vue'
import ModernLayout from './layouts/ModernLayout.vue'

const { server, pathValue, method, security, collection, store } = defineProps<{
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

  // ---------------------------------------------
  store: WorkspaceStore
  /** @deprecated Use `document` instead, we just need the selected security scheme uids for now */
  collection: Collection
  options: {
    layout: 'classic' | 'modern'
    /** Sets some additional display properties when an operation is a webhook */
    isWebhook: boolean
    showOperationId: boolean | undefined
    hideTestRequestButton: boolean | undefined
    expandAllResponses: boolean | undefined
    clientOptions: ClientOptionGroup[]
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
const { securitySchemes } = useWorkspace()
const selectedSecuritySchemes = computed(() =>
  filterSecurityRequirements(
    operation.value?.security || security || [],
    collection.selectedSecuritySchemeUids,
    securitySchemes,
  ).map(convertSecurityScheme),
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
    <template v-if="options?.layout === 'classic'">
      <ClassicLayout
        :id="id"
        :method="method"
        :operation="operation"
        :options="options"
        :path="path"
        :securitySchemes="selectedSecuritySchemes"
        :server="selectedServer"
        :store="store" />
    </template>
    <template v-else>
      <ModernLayout
        :id="id"
        :method="method"
        :operation="operation"
        :options="options"
        :path="path"
        :securitySchemes="selectedSecuritySchemes"
        :server="selectedServer"
        :store="store" />
    </template>
  </template>
</template>
