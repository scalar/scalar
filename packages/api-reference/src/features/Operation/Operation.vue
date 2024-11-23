<script lang="ts" setup>
import type { WorkspaceStore } from '@scalar/api-client/store'
import type { Collection, Server } from '@scalar/oas-utils/entities/spec'
import type { TransformedOperation } from '@scalar/types/legacy'

import { useRequestExample } from './hooks/useRequestExample'
import ClassicLayout from './layouts/ClassicLayout.vue'
import ModernLayout from './layouts/ModernLayout.vue'

const {
  id,
  layout = 'modern',
  operation,
  collection,
  requests,
  requestExamples,
  securitySchemes,
  server,
} = defineProps<{
  id?: string
  layout?: 'modern' | 'classic'
  operation: TransformedOperation
  collection?: Collection
  requests: WorkspaceStore['requests']
  requestExamples: WorkspaceStore['requestExamples']
  securitySchemes: WorkspaceStore['securitySchemes']
  server: Server
}>()

const { request, secretCredentials } = useRequestExample({
  operation,
  collection,
  requests,
  requestExamples,
  securitySchemes,
  server,
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
