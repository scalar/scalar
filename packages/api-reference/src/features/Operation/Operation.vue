<script lang="ts" setup>
import { useWorkspace } from '@scalar/api-client/store'
import type { Collection, Server } from '@scalar/oas-utils/entities/spec'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import type { TransformedOperation } from '@scalar/types/legacy'
import { computed } from 'vue'

import { getPointer } from '@/blocks/helpers/getPointer'
import { useBlockProps } from '@/blocks/hooks/useBlockProps'
import type { Schemas } from '@/features/Operation/types/schemas'
import { useOperationDiscriminator } from '@/hooks/useOperationDiscriminator'

import ClassicLayout from './layouts/ClassicLayout.vue'
import ModernLayout from './layouts/ModernLayout.vue'

const {
  id,
  layout = 'modern',
  transformedOperation,
  collection,
  server,
  schemas,
} = defineProps<{
  id?: string
  layout?: 'modern' | 'classic'
  transformedOperation: TransformedOperation
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
 * Resolve the matching operation from the store
 *
 * TODO: In the future, we won’t need this.
 *
 * We’ll be able to just use the request entitiy from the store directly, once we loop over those,
 * instead of using the super custom transformed `parsedSpec` that we’re using now.
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
  <template v-if="collection && operation">
    <template v-if="layout === 'classic'">
      <ClassicLayout
        :id="id"
        :collection="collection"
        :operation="transformedOperation.information"
        :request="operation"
        :schemas="schemas"
        :server="operationServer"
        @update:modelValue="handleDiscriminatorChange" />
    </template>
    <template v-else>
      <ModernLayout
        :id="id"
        :collection="collection"
        :operation="transformedOperation.information"
        :request="operation"
        :schemas="schemas"
        :server="operationServer"
        @update:modelValue="handleDiscriminatorChange" />
    </template>
  </template>
</template>
