<script lang="ts" setup>
import { getLocation } from '@/blocks/helpers/getLocation'
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

// TODO: Take the store as a prop, not a transformed operation
const { operation: requestEntity } = useBlockProps({
  // @ts-expect-error TODO: Deal with a potential undefined store
  store,
  location: getLocation(['paths', operation.path, operation.httpVerb]),
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
