<script lang="ts" setup>
import { useWorkspace } from '@scalar/api-client/store'
import { filterSecurityRequirements } from '@scalar/api-client/views/Request/RequestSection'
import type { HttpMethod } from '@scalar/helpers/http/http-methods'
import type { Collection, Server } from '@scalar/oas-utils/entities/spec'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import { isReference } from '@scalar/workspace-store/schemas/v3.1/type-guard'
import { computed } from 'vue'

import { convertSecurityScheme } from '@/helpers/convert-security-scheme'
import { useOperationDiscriminator } from '@/hooks/useOperationDiscriminator'

import ClassicLayout from './layouts/ClassicLayout.vue'
import ModernLayout from './layouts/ModernLayout.vue'

const {
  layout = 'modern',
  document,
  server,
  isWebhook,
  collection,
  path,
  method,
  store,
} = defineProps<{
  path: string
  method: HttpMethod
  isWebhook: boolean
  layout?: 'modern' | 'classic'
  id: string
  server: Server | undefined
  store: WorkspaceStore
  /** @deprecated Use `document` instead, we just need the selected security scheme uids for now */
  collection: Collection
  /** @deprecated Use the new workspace store instead*/
  document?: OpenAPIV3_1.Document
}>()

/**
 * Operation from the new workspace store, ensure we are de-referenced
 * TODO: loading/error states
 */
const operation = computed(() => {
  const initialKey = isWebhook ? 'webhooks' : 'paths'
  const entity = store.workspace.activeDocument?.[initialKey]?.[path]?.[method]

  if (isReference(entity)) {
    return null
  }

  return entity
})

const oldOperation = computed(() =>
  isWebhook
    ? document?.webhooks?.[path]?.[method]
    : document?.paths?.[path]?.[method],
)

/**
 * Handle the selection of discriminator in the request body (anyOf, oneOf…)
 *
 * TODO: update this to use the new store
 */
const { handleDiscriminatorChange } = useOperationDiscriminator(
  oldOperation.value,
  document?.components?.schemas,
)

/**
 * TEMP
 * This still uses the client store and formats it into the new store format
 */
const { securitySchemes } = useWorkspace()
const selectedSecuritySchemes = computed(() =>
  filterSecurityRequirements(
    operation.value?.security || document?.security,
    collection.selectedSecuritySchemeUids,
    securitySchemes,
  ).map(convertSecurityScheme),
)
</script>

<template>
  <template v-if="operation && oldOperation">
    <template v-if="layout === 'classic'">
      <ClassicLayout
        :id="id"
        :isWebhook="isWebhook"
        :method="method"
        :operation="operation"
        :oldOperation="oldOperation"
        :securitySchemes="selectedSecuritySchemes"
        :store="store"
        :path="path"
        :schemas="document?.components?.schemas"
        :server="server"
        @update:modelValue="handleDiscriminatorChange" />
    </template>
    <template v-else>
      <ModernLayout
        :id="id"
        :isWebhook="isWebhook"
        :method="method"
        :oldOperation="oldOperation"
        :securitySchemes="selectedSecuritySchemes"
        :path="path"
        :store="store"
        :operation="operation"
        :schemas="document?.components?.schemas"
        :server="server"
        @update:modelValue="handleDiscriminatorChange" />
    </template>
  </template>
</template>
