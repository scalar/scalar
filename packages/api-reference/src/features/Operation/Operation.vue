<script lang="ts" setup>
import { useWorkspace } from '@scalar/api-client/store'
import { filterSecurityRequirements } from '@scalar/api-client/views/Request/RequestSection'
import type { HttpMethod } from '@scalar/helpers/http/http-methods'
import type { Collection, Server } from '@scalar/oas-utils/entities/spec'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import { isReference } from '@scalar/workspace-store/schemas/v3.1/type-guard'
import { computed } from 'vue'

import { convertSecurityScheme } from '@/helpers/convert-security-scheme'
import { useOperationDiscriminator } from '@/hooks/useOperationDiscriminator'
import { useStore } from '@/v2/hooks/useStore'

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
} = defineProps<{
  path: string
  method: HttpMethod
  isWebhook?: boolean
  layout?: 'modern' | 'classic'
  id: string
  server: Server | undefined
  /** @deprecated Use `document` instead, we just need the selected security scheme uids for now */
  collection: Collection
  /** @deprecated Use the new workspace store instead*/
  document?: OpenAPIV3_1.Document
}>()

const { resolve, workspace } = useStore()

/**
 * Operation from the new workspace store
 */
const operation = computed(() => {
  const initialKey = isWebhook ? 'webhooks' : 'paths'
  const entity = workspace.activeDocument?.[initialKey]?.[path]?.[method]

  return entity
})

/**
 * Handle the selection of discriminator in the request body (anyOf, oneOf…)
 */
const { handleDiscriminatorChange } = useOperationDiscriminator(
  // TODO update this to use the new store
  isWebhook
    ? document?.webhooks?.[path]?.[method]
    : document?.paths?.[path]?.[method],
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
  <template v-if="operation">
    <template v-if="layout === 'classic'">
      <ClassicLayout
        :id="id"
        :isWebhook="isWebhook"
        :method="method"
        :operation="operation"
        :securitySchemes="selectedSecuritySchemes"
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
        :securitySchemes="selectedSecuritySchemes"
        :path="path"
        :operation="operation"
        :schemas="document?.components?.schemas"
        :server="server"
        @update:modelValue="handleDiscriminatorChange" />
    </template>
  </template>
</template>
