<script setup lang="ts">
import type { Request as RequestEntity } from '@scalar/oas-utils/entities/spec'

import ParameterList from './ParameterList.vue'
import RequestBody from './RequestBody.vue'

const props = defineProps<{
  operation?: RequestEntity
}>()

const filterParameters = (where: 'path' | 'query' | 'header' | 'cookie') =>
  props.operation?.parameters?.filter((parameter) => parameter.in === where) ??
  []
</script>
<template>
  <!-- Path operation-->
  <ParameterList :operation="filterParameters('path')">
    <template #title>Path Parameters</template>
  </ParameterList>

  <!-- Query operation -->
  <ParameterList :operation="filterParameters('query')">
    <template #title>Query Parameters</template>
  </ParameterList>

  <!-- Headers -->
  <ParameterList :operation="filterParameters('header')">
    <template #title>Headers</template>
  </ParameterList>

  <!-- Form data -->
  <!-- TODO: How does formdata work in OpenAPI 3.1 again? -->
  <!-- <ParameterList :operation="parameterMap.formData">
    <template #title>Form Data</template>
  </ParameterList> -->

  <!-- Request body -->
  <RequestBody
    v-if="operation?.requestBody"
    :requestBody="operation.requestBody">
    <template #title>Body</template>
  </RequestBody>
</template>
