<script lang="ts" setup>
import { useWorkspace } from '@scalar/api-client/store'
import type { Collection, Server } from '@scalar/oas-utils/entities/spec'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import { computed } from 'vue'

import { getPointer } from '@/blocks/helpers/getPointer'
import { useBlockProps } from '@/blocks/hooks/useBlockProps'
import { useOperationDiscriminator } from '@/hooks/useOperationDiscriminator'

import ClassicLayout from './layouts/ClassicLayout.vue'
import ModernLayout from './layouts/ModernLayout.vue'

const {
  layout = 'modern',
  document,
  collection,
  server,
  isWebhook,
  path,
  method,
} = defineProps<{
  document?: OpenAPIV3_1.Document
  path: string
  method: OpenAPIV3_1.HttpMethods
  isWebhook?: boolean
  layout?: 'modern' | 'classic'
  id: string
  /**
   * @deprecated Use `document` instead
   */
  collection: Collection
  server: Server | undefined
}>()

const store = useWorkspace()

/**
 * NEW: We're using the dereferenced document to get the operation.
 *
 * This will come from the new workspace store soon.
 *
 * This is what we want to use in the future.
 */
const operation = computed(() =>
  isWebhook
    ? document?.webhooks?.[path]?.[method]
    : document?.paths?.[path]?.[method],
)

/**
 * Handle the selection of discriminator in the request body (anyOf, oneOf…)
 */
const { handleDiscriminatorChange } = useOperationDiscriminator(
  operation.value,
  document?.components?.schemas,
)

/**
 * Resolve the matching operation from the store
 *
 * @deprecated TODO: In the future, we won't need this. We want to work with more or less plain OpenAPI objects.
 */
const { operation: request } = useBlockProps({
  store,
  collection,
  location: getPointer([isWebhook ? 'webhooks' : 'paths', path, method]),
})

/** Return operation server if available or fallback to the collection server */
const operationServer = computed(() => {
  if (!request.value) {
    return server
  }

  if (request.value?.selectedServerUid) {
    const operationServer = store.servers[request.value.selectedServerUid]

    if (operationServer) {
      return operationServer
    }
  }

  // Fallback to the provided server
  return server
})
</script>

<template>
  <template v-if="collection && operation">
    <template v-if="layout === 'classic'">
      <ClassicLayout
        :id="id"
        :operation="operation"
        :collection="collection"
        :isWebhook="isWebhook"
        :method="method"
        :path="path"
        :request="request"
        :schemas="document?.components?.schemas"
        :server="operationServer"
        @update:modelValue="handleDiscriminatorChange" />
    </template>
    <template v-else>
      <ModernLayout
        :id="id"
        :collection="collection"
        :isWebhook="isWebhook"
        :method="method"
        :path="path"
        :request="request"
        :operation="operation"
        :schemas="document?.components?.schemas"
        :server="operationServer"
        @update:modelValue="handleDiscriminatorChange" />
    </template>
  </template>
</template>
