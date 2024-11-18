<script lang="ts" setup>
import { useServerStore } from '#legacy'
import { ExampleRequest } from '@/features/ExampleRequest'
import OperationPath from '@/features/Operation/OperationPath.vue'
import TestRequestButton from '@/features/Operation/TestRequestButton.vue'
import type { Spec, TransformedOperation } from '@scalar/types/legacy'
import { toRef } from 'vue'

import type { OpenApiDocumentConfiguration } from '../OpenApiDocument/types'

const props = defineProps<{
  parsedSpec: Spec
  operation?: TransformedOperation
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
</script>
<template>
  <div class="scalar-app">
    <ExampleRequest
      v-if="operation"
      :operation="operation">
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
