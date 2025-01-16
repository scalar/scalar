<script setup lang="ts">
import type { Request as RequestEntity } from '@scalar/oas-utils/entities/spec'

import ParameterList from './ParameterList.vue'
import RequestBody from './RequestBody.vue'

const props = defineProps<{
  operation?: Pick<RequestEntity, 'parameters' | 'requestBody'>
}>()

const filterParameters = (where: 'path' | 'query' | 'header' | 'cookie') =>
  props.operation?.parameters?.filter((parameter) => parameter.in === where) ??
  []
</script>
<template>
  <!-- Path parameters-->
  <ParameterList :parameters="filterParameters('path')">
    <template #title>Path Parameters</template>
  </ParameterList>

  <!-- Query parameters -->
  <ParameterList :parameters="filterParameters('query')">
    <template #title>Query Parameters</template>
  </ParameterList>

  <!-- Headers -->
  <ParameterList :parameters="filterParameters('header')">
    <template #title>Headers</template>
  </ParameterList>

  <!-- Cookies -->
  <ParameterList :parameters="filterParameters('cookie')">
    <template #title>Cookies</template>
  </ParameterList>

  <!-- Request body -->
  <RequestBody
    v-if="operation?.requestBody"
    :requestBody="operation.requestBody">
    <template #title>Body</template>
  </RequestBody>
</template>
