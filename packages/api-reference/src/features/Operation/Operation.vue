<script lang="ts" setup>
import {
  type WorkspaceStore,
  useActiveEntities,
} from '@scalar/api-client/store'
import type { TransformedOperation } from '@scalar/types/legacy'

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
</script>

<template>
  <template v-if="layout === 'classic'">
    <ClassicLayout
      :id="id"
      :operation="operation"
      :request="request"
      :secretCredentials="secretCredentials" />
  </template>
  <template v-else>
    <ModernLayout
      :id="id"
      :operation="operation"
      :request="request"
      :secretCredentials="secretCredentials" />
  </template>
</template>
