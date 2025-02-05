<script lang="ts" setup>
import { getPointer } from '@/blocks/helpers/getPointer'
import { useBlockProps } from '@/blocks/hooks/useBlockProps'
import { useWorkspace } from '@scalar/api-client/store'
import type { Collection, Server } from '@scalar/oas-utils/entities/spec'
import type { TransformedOperation } from '@scalar/types/legacy'

import ClassicLayout from './layouts/ClassicLayout.vue'
import ModernLayout from './layouts/ModernLayout.vue'

const {
  id,
  layout = 'modern',
  transformedOperation,
  collection,
  server,
} = defineProps<{
  id?: string
  layout?: 'modern' | 'classic'
  transformedOperation: TransformedOperation
  collection: Collection | undefined
  server: Server | undefined
}>()

const store = useWorkspace()

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
  location: getPointer([
    'paths',
    transformedOperation.path,
    transformedOperation.httpVerb.toLowerCase(),
  ]),
})
</script>

<template>
  <template v-if="collection && operation">
    <template v-if="layout === 'classic'">
      <ClassicLayout
        :id="id"
        :collection="collection"
        :operation="operation"
        :server="server"
        :transformedOperation="transformedOperation" />
    </template>
    <template v-else>
      <ModernLayout
        :id="id"
        :collection="collection"
        :operation="operation"
        :server="server"
        :transformedOperation="transformedOperation" />
    </template>
  </template>
</template>
