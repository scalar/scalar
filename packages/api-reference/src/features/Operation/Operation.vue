<script lang="ts" setup>
import { useWorkspace } from '@scalar/api-client/store'
import { filterSecurityRequirements } from '@scalar/api-client/views/Request/RequestSection'
import type { HttpMethod } from '@scalar/helpers/http/http-methods'
import type { Collection, Server } from '@scalar/oas-utils/entities/spec'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import type { ParameterObject } from '@scalar/workspace-store/schemas/v3.1/strict/parameter'
import {
  isReference,
  isResolvedRef,
} from '@scalar/workspace-store/schemas/v3.1/type-guard'
import { computed } from 'vue'

import { convertSecurityScheme } from '@/helpers/convert-security-scheme'
import { useOperationDiscriminator } from '@/hooks/useOperationDiscriminator'
import type { ClientOptionGroup } from '@/v2/blocks/scalar-request-example-block/types'

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
  clientOptions: ClientOptionGroup[]
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

/** Grab the pathItem from either webhooks or paths */
const pathItem = computed(() => {
  const initialKey = isWebhook ? 'webhooks' : 'paths'
  return store.workspace.activeDocument?.[initialKey]?.[path]
})

/**
 * Operation from the new workspace store, ensure we are de-referenced
 * TODO: loading/error states
 */
const operation = computed(() => {
  const entity = pathItem.value?.[method]

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

/**
 * Dereference path parameters and combine with operation parameters
 *
 * Ensure that operation parameters take prescedence and there are no duplicates
 */
const parameters = computed(() => {
  const pathParams = pathItem.value?.parameters ?? []
  const operationParams = operation.value?.parameters ?? []

  const allParams = [...pathParams, ...operationParams].filter(
    isResolvedRef<ParameterObject>,
  )

  // Use a Map to ensure unique in+name combinations
  // Operation parameters take precedence over path parameters
  const uniqueParams = new Map<string, ParameterObject>()

  for (const param of allParams) {
    const key = `${param.in}:${param.name}`
    uniqueParams.set(key, param)
  }

  return Array.from(uniqueParams.values())
})
</script>

<template>
  <template v-if="operation && oldOperation">
    <template v-if="layout === 'classic'">
      <ClassicLayout
        :id="id"
        :isWebhook
        :method="method"
        :operation="operation"
        :oldOperation="oldOperation"
        :clientOptions="clientOptions"
        :securitySchemes="selectedSecuritySchemes"
        :parameters="parameters"
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
        :clientOptions="clientOptions"
        :oldOperation="oldOperation"
        :securitySchemes="selectedSecuritySchemes"
        :parameters="parameters"
        :path="path"
        :store="store"
        :operation="operation"
        :schemas="document?.components?.schemas"
        :server="server"
        @update:modelValue="handleDiscriminatorChange" />
    </template>
  </template>
</template>
