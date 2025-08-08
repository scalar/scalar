<script lang="ts" setup>
import { useWorkspace } from '@scalar/api-client/store'
import { filterSecurityRequirements } from '@scalar/api-client/views/Request/RequestSection'
import type { HttpMethod } from '@scalar/helpers/http/http-methods'
import type { Collection, Server } from '@scalar/oas-utils/entities/spec'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import type { OpenApiDocument } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { isReference } from '@scalar/workspace-store/schemas/v3.1/type-guard'
import { computed } from 'vue'

import { combineParams } from '@/features/Operation/helpers/combine-params'
import { convertSecurityScheme } from '@/helpers/convert-security-scheme'
import type { ClientOptionGroup } from '@/v2/blocks/scalar-request-example-block/types'

import ClassicLayout from './layouts/ClassicLayout.vue'
import ModernLayout from './layouts/ModernLayout.vue'

const {
  layout = 'modern',
  server,
  document,
  isWebhook,
  collection,
  path,
  method,
  store,
} = defineProps<{
  path: string
  method: HttpMethod
  clientOptions: ClientOptionGroup[]
  document: OpenApiDocument
  isWebhook: boolean
  layout?: 'modern' | 'classic'
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
  const entity = pathItem.value?.[method]

  if (!entity || isReference(entity)) {
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
</script>

<template>
  <template v-if="operation">
    <template v-if="layout === 'classic'">
      <ClassicLayout
        :id="id"
        :isWebhook
        :method="method"
        :operation="operation"
        :clientOptions="clientOptions"
        :securitySchemes="selectedSecuritySchemes"
        :store="store"
        :path="path"
        :server="server" />
    </template>
    <template v-else>
      <ModernLayout
        :id="id"
        :isWebhook="isWebhook"
        :method="method"
        :clientOptions="clientOptions"
        :securitySchemes="selectedSecuritySchemes"
        :path="path"
        :store="store"
        :operation="operation"
        :server="server" />
    </template>
  </template>
</template>
