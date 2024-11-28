<script lang="ts" setup>
import { useServerStore } from '#legacy'
import OperationPath from '@/components/OperationPath.vue'
import { ExampleRequest } from '@/features/ExampleRequest'
import { useRequestExample } from '@/features/Operation/hooks/useRequestExample'
import { TestRequestButton } from '@/features/TestRequestButton'
import { useActiveEntities, useWorkspace } from '@scalar/api-client/store'
import type { Spec, TransformedOperation } from '@scalar/types/legacy'
import { toRef } from 'vue'

import type { OpenApiDocumentConfiguration } from '../OpenApiDocument/types'

const props = defineProps<{
  parsedSpec: Spec
  operation: TransformedOperation
  configuration?: OpenApiDocumentConfiguration
}>()

const specification = toRef(props.parsedSpec)
const defaultServerUrl = toRef(props.configuration?.baseServerURL)
const servers = toRef(props.configuration?.servers)

useServerStore({
  specification,
  defaultServerUrl,
  servers,
})

const { activeCollection, activeServer } = useActiveEntities()
const { requests, requestExamples, securitySchemes } = useWorkspace()
const { request, secretCredentials } = useRequestExample({
  operation: props.operation,
  collection: activeCollection,
  requests,
  requestExamples,
  securitySchemes,
  server: activeServer,
})
</script>
<template>
  <div class="scalar-app">
    <ExampleRequest
      :operation="operation"
      :request="request"
      :secretCredentials="secretCredentials">
      <template #header>
        <OperationPath
          class="example-path"
          :deprecated="operation.information?.deprecated"
          :path="operation.path" />
      </template>
      <template #footer>
        <TestRequestButton :operation="operation" />
      </template>
    </ExampleRequest>
  </div>
</template>
