<script setup lang="ts">
import type { TransformedOperation } from '@scalar/types/legacy'

import { useOperation } from '../../../hooks'
import Parameters from './Parameters.vue'
import RequestBody from './RequestBody.vue'

const props = defineProps<{ operation: TransformedOperation }>()

const { parameterMap } = useOperation(props.operation)
</script>
<template>
  <!-- Path parameters-->
  <Parameters :parameters="parameterMap.path">
    <template #title>Path Parameters</template>
  </Parameters>

  <!-- Query parameters -->
  <Parameters :parameters="parameterMap.query">
    <template #title>Query Parameters</template>
  </Parameters>

  <!-- Headers -->
  <Parameters :parameters="parameterMap.header">
    <template #title>Headers</template>
  </Parameters>

  <!-- Body parameters -->
  <Parameters
    :parameters="parameterMap.body"
    showChildren>
    <template #title>Body Parameters</template>
  </Parameters>

  <!-- Form data -->
  <Parameters :parameters="parameterMap.formData">
    <template #title>Form Data</template>
  </Parameters>

  <!-- Request body -->
  <RequestBody
    v-if="operation.information?.requestBody"
    :requestBody="operation.information?.requestBody">
    <template #title>Body</template>
  </RequestBody>
</template>
