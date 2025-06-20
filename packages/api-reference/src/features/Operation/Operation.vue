<script lang="ts" setup>
import { useWorkspace } from '@scalar/api-client/store'
import type { Collection, Server } from '@scalar/oas-utils/entities/spec'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import type { TransformedOperation } from '@scalar/types/legacy'
import { computed } from 'vue'

import { getPointer } from '@/blocks/helpers/getPointer'
import { useBlockProps } from '@/blocks/hooks/useBlockProps'
import { useOperationDiscriminator } from '@/hooks/useOperationDiscriminator'

import ClassicLayout from './layouts/ClassicLayout.vue'
import ModernLayout from './layouts/ModernLayout.vue'

const {
  layout = 'modern',
  document,
  transformedOperation,
  collection,
  server,
  schemas,
} = defineProps<{
  layout?: 'modern' | 'classic'
  id: string
  document?: OpenAPIV3_1.Document
  /**
   * @deprecated Use `document` instead
   */
  transformedOperation: TransformedOperation
  /**
   * @deprecated Use `document` instead
   */
  collection: Collection
  server: Server | undefined
  schemas?: Record<string, OpenAPIV3_1.SchemaObject> | unknown
}>()

const store = useWorkspace()

// Setup discriminator handling
const { handleDiscriminatorChange } = useOperationDiscriminator(
  transformedOperation,
  schemas,
)

/**
 * NEW: We’re using the dereferenced document to get the operation.
 *
 * This will come from the new workspace store soon.
 *
 * This is what we want to use in the future.
 */
const newOperation = computed(() => {
  return document?.paths?.[transformedOperation.path]?.[
    transformedOperation.httpVerb.toLowerCase()
  ]
})

/**
 * Resolve the matching operation from the store
 *
 * TODO: In the future, we won’t need this.
 *
 * We’ll be able to just use the request entitiy from the store directly, once we loop over those,
 * instead of using the super custom transformed `parsedSpec` that we’re using now.
 *
 * @deprecated
 */
const { operation } = useBlockProps({
  store,
  collection,
  location: getPointer([
    'paths',
    transformedOperation.path,
    transformedOperation.httpVerb.toLowerCase(),
  ]),
})

/** Return operation server if available or fallback to the collection server */
const operationServer = computed(() => {
  if (!operation.value) {
    return server
  }

  if (operation.value?.selectedServerUid) {
    const operationServer = store.servers[operation.value.selectedServerUid]
    if (operationServer) {
      return operationServer
    }
  }

  // Fallback to the provided server
  return server
})
</script>

<template>
  <template v-if="collection && newOperation">
    <template v-if="layout === 'classic'">
      <ClassicLayout
        :id="id"
        :operation="newOperation"
        :collection="collection"
        :method="transformedOperation.httpVerb"
        :path="transformedOperation.path"
        :request="operation"
        :transformedOperation="transformedOperation"
        :schemas="schemas"
        :server="operationServer"
        @update:modelValue="handleDiscriminatorChange" />
    </template>
    <template v-else>
      <ModernLayout
        :id="id"
        :collection="collection"
        :method="transformedOperation.httpVerb"
        :path="transformedOperation.path"
        :request="operation"
        :operation="newOperation"
        :transformedOperation="transformedOperation"
        :schemas="schemas"
        :server="operationServer"
        @update:modelValue="handleDiscriminatorChange" />
    </template>
  </template>
</template>
