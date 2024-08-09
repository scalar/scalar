<script lang="ts" setup>
import { useServerStore } from '#legacy'
import type { Spec, TransformedOperation } from '@scalar/oas-utils'
// import type { OpenAPI } from '@scalar/openapi-parser'
import { toRef } from 'vue'

import EndpointPath from '../../components/Content/Operation/EndpointPath.vue'
// import TestRequestButton from '../../components/Content/Operation/TestRequestButton.vue'
import { ExampleRequest } from '../../features/ExampleRequest'
import type { OpenApiDocumentConfiguration } from '../OpenApiDocument/types'

const props = defineProps<{
  // dereferenced?: OpenAPI.Document
  transformed: Spec
  operation?: TransformedOperation
  configuration?: OpenApiDocumentConfiguration
}>()

const specification = toRef(props.transformed)
const defaultServerUrl = toRef(props.configuration?.baseServerURL)
const servers = toRef(props.configuration?.servers)

useServerStore({
  specification,
  defaultServerUrl,
  servers,
})
</script>
<template>
  <ExampleRequest
    v-if="operation"
    :operation="operation">
    <template #header>
      <EndpointPath
        class="example-path"
        :deprecated="operation.information?.deprecated"
        :path="operation.path" />
    </template>
    <!-- <template #footer>
      <TestRequestButton :operation="operation" />
    </template> -->
  </ExampleRequest>
</template>
