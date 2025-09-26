<script lang="ts" setup>
import { useWorkspace } from '@scalar/api-client/store'
import type { ClientOptionGroup } from '@scalar/api-client/v2/blocks/operation-code-sample'
import { filterSecurityRequirements } from '@scalar/api-client/views/Request/RequestSection'
import type { HttpMethod } from '@scalar/helpers/http/http-methods'
import type { Collection, Server } from '@scalar/oas-utils/entities/spec'
import type { ApiReferenceConfiguration } from '@scalar/types'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type {
  OpenApiDocument,
  ServerObject,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { computed } from 'vue'

import { combineParams } from '@/features/Operation/helpers/combine-params'
import { convertSecurityScheme } from '@/helpers/convert-security-scheme'

import { getFirstServer } from './helpers/get-first-server'
import ClassicLayout from './layouts/ClassicLayout.vue'
import ModernLayout from './layouts/ModernLayout.vue'

const { server, config, document, isWebhook, collection, path, method, store } =
  defineProps<{
    path: string
    method: HttpMethod
    clientOptions: ClientOptionGroup[]
    config: ApiReferenceConfiguration
    document: OpenApiDocument
    isWebhook: boolean
    id: string
    server: Server | undefined
    store: WorkspaceStore
    /** @deprecated Use `document` instead, we just need the selected security scheme uids for now */
    collection: Collection
  }>()

/** Grab the pathItem from either webhooks or paths */
const pathItem = computed(() => {
  const initialKey = isWebhook ? 'webhooks' : 'paths'
  return document[initialKey]?.[path]
})

/**
 * Operation from the new workspace store, ensure we are de-referenced
 *
 * Also adds in params from the pathItemObject
 */
const operation = computed(() => {
  const entity = getResolvedRef(pathItem.value?.[method])

  if (!entity) {
    return null
  }

  // Combine params from the pathItem and the operation
  const parameters = combineParams(
    pathItem.value?.parameters,
    entity.parameters,
  )

  return { ...entity, parameters }
})

/**
 * TEMP
 * This still uses the client store and formats it into the new store format
 */
const { securitySchemes } = useWorkspace()
const selectedSecuritySchemes = computed(() =>
  filterSecurityRequirements(
    operation.value?.security || document.security || [],
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
    pathItem.value?.servers,
    // 3) Document
    server,
  ),
)
</script>

<template>
  <template v-if="operation">
    <template v-if="config.layout === 'classic'">
      <ClassicLayout
        :id="id"
        :clientOptions="clientOptions"
        :config="config"
        :isWebhook
        :method="method"
        :operation="operation"
        :path="path"
        :securitySchemes="selectedSecuritySchemes"
        :server="selectedServer"
        :store="store" />
    </template>
    <template v-else>
      <ModernLayout
        :id="id"
        :clientOptions="clientOptions"
        :config="config"
        :isWebhook="isWebhook"
        :method="method"
        :operation="operation"
        :path="path"
        :securitySchemes="selectedSecuritySchemes"
        :server="selectedServer"
        :store="store" />
    </template>
  </template>
</template>
