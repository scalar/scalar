<script lang="ts" setup>
import { getPointer } from '@/blocks/helpers/getPointer'
import { useBlockProps } from '@/blocks/hooks/useBlockProps'
import {
  WORKSPACE_SYMBOL,
  type WorkspaceStore,
  useActiveEntities,
} from '@scalar/api-client/store'
import type { TransformedOperation } from '@scalar/types/legacy'
import { inject } from 'vue'

import { useRequestExample } from './hooks/useRequestExample'
import ClassicLayout from './layouts/ClassicLayout.vue'
import ModernLayout from './layouts/ModernLayout.vue'

const {
  id,
  layout = 'modern',
  operation,
  requests,
  requestExamples,
  securitySchemes,
} = defineProps<{
  id?: string
  layout?: 'modern' | 'classic'
  operation: TransformedOperation
  requests: WorkspaceStore['requests']
  requestExamples: WorkspaceStore['requestExamples']
  securitySchemes: WorkspaceStore['securitySchemes']
}>()

const { activeCollection, activeServer } = useActiveEntities()
const { request, secretCredentials } = useRequestExample({
  operation,
  collection: activeCollection,
  requests,
  requestExamples,
  securitySchemes,
  server: activeServer,
})

const store = inject(WORKSPACE_SYMBOL)

/**
 * Resolve the matching operation from the store
 *
 * TODO: In the future, we won’t need this.
 *
 * We’ll be able to just use the request entitiy from the store directly, once we loop over those,
 * instead of using the super custom transformed `parsedSpec` that we’re using now.
 */
const { operation: requestEntity } = useBlockProps({
  store,
  location: getPointer([
    'paths',
    operation.path,
    operation.httpVerb.toLowerCase(),
  ]),
})
</script>

<template>
  <template v-if="layout === 'classic'">
    <ClassicLayout
      :id="id"
      :operation="operation"
      :request="request"
      :requestEntity="requestEntity"
      :secretCredentials="secretCredentials" />
  </template>
  <template v-else>
    <ModernLayout
      :id="id"
      :operation="operation"
      :request="request"
      :requestEntity="requestEntity"
      :secretCredentials="secretCredentials" />
  </template>
</template>
