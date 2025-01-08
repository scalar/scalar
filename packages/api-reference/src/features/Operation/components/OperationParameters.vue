<script setup lang="ts">
import { useOperation } from '@/hooks'
import type { TransformedOperation } from '@scalar/types/legacy'

import ParameterList from './ParameterList.vue'
import RequestBody from './RequestBody.vue'

const props = defineProps<{
  operation: TransformedOperation
}>()

const { parameterMap } = useOperation(props.operation)
</script>
<template>
  <!-- Path parameters-->
  <ParameterList :parameters="parameterMap.path">
    <template #title>Path Parameters</template>
  </ParameterList>

  <!-- Query parameters -->
  <ParameterList :parameters="parameterMap.query">
    <template #title>Query Parameters</template>
  </ParameterList>

  <!-- Headers -->
  <ParameterList :parameters="parameterMap.header">
    <template #title>Headers</template>
  </ParameterList>

  <!-- Cookies -->
  <ParameterList :parameters="parameterMap.cookie">
    <template #title>Cookies</template>
  </ParameterList>

  <!-- Body parameters -->
  <ParameterList
    :parameters="parameterMap.body"
    showChildren>
    <template #title>Body Parameters</template>
  </ParameterList>

  <!-- Form data -->
  <ParameterList :parameters="parameterMap.formData">
    <template #title>Form Data</template>
  </ParameterList>

  <!-- Request body -->
  <RequestBody
    v-if="operation.information?.requestBody"
    :requestBody="operation.information?.requestBody">
    <template #title>Body</template>
  </RequestBody>
</template>
