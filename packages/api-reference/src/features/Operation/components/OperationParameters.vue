<script setup lang="ts">
import type {
  ParameterObject,
  RequestBodyObject,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

import ParameterList from './ParameterList.vue'
import RequestBody from './RequestBody.vue'

const { parameters = [], requestBody } = defineProps<{
  breadcrumb?: string[]
  parameters?: ParameterObject[]
  requestBody?: RequestBodyObject | undefined
}>()

const filterParameters = (where: 'path' | 'query' | 'header' | 'cookie') =>
  parameters?.filter((parameter) => parameter.in === where) ?? []
</script>
<template>
  <!-- Path parameters-->
  <ParameterList
    :breadcrumb="breadcrumb ? [...breadcrumb, 'path'] : undefined"
    :parameters="filterParameters('path')">
    <template #title>Path Parameters</template>
  </ParameterList>

  <!-- Query parameters -->
  <ParameterList
    :breadcrumb="breadcrumb ? [...breadcrumb, 'query'] : undefined"
    :parameters="filterParameters('query')">
    <template #title>Query Parameters</template>
  </ParameterList>

  <!-- Headers -->
  <ParameterList
    :breadcrumb="breadcrumb ? [...breadcrumb, 'headers'] : undefined"
    :parameters="filterParameters('header')">
    <template #title>Headers</template>
  </ParameterList>

  <!-- Cookies -->
  <ParameterList
    :breadcrumb="breadcrumb ? [...breadcrumb, 'cookies'] : undefined"
    :parameters="filterParameters('cookie')">
    <template #title>Cookies</template>
  </ParameterList>

  <!-- Request body -->
  <RequestBody
    v-if="requestBody"
    :breadcrumb="breadcrumb ? [...breadcrumb, 'body'] : undefined"
    :requestBody="requestBody">
    <template #title>Body</template>
  </RequestBody>
</template>
