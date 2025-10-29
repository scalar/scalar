<script setup lang="ts">
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
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
  eventBus: WorkspaceEventBus | null
  options: {
    orderRequiredPropertiesFirst: boolean | undefined
    orderSchemaPropertiesBy: 'alpha' | 'preserve' | undefined
  }
}>()

const filterParameters = (where: 'path' | 'query' | 'header' | 'cookie') =>
  parameters?.filter((parameter) => parameter.in === where) ?? []
</script>
<template>
  <!-- Path parameters-->
  <ParameterList
    :breadcrumb="breadcrumb ? [...breadcrumb, 'path'] : undefined"
    :eventBus="eventBus"
    :options="options"
    :parameters="filterParameters('path')">
    <template #title>Path Parameters</template>
  </ParameterList>

  <!-- Query parameters -->
  <ParameterList
    :breadcrumb="breadcrumb ? [...breadcrumb, 'query'] : undefined"
    :eventBus="eventBus"
    :options="options"
    :parameters="filterParameters('query')">
    <template #title>Query Parameters</template>
  </ParameterList>

  <!-- Headers -->
  <ParameterList
    :breadcrumb="breadcrumb ? [...breadcrumb, 'headers'] : undefined"
    :eventBus="eventBus"
    :options="options"
    :parameters="filterParameters('header')">
    <template #title>Headers</template>
  </ParameterList>

  <!-- Cookies -->
  <ParameterList
    :breadcrumb="breadcrumb ? [...breadcrumb, 'cookies'] : undefined"
    :eventBus="eventBus"
    :options="options"
    :parameters="filterParameters('cookie')">
    <template #title>Cookies</template>
  </ParameterList>

  <!-- Request body -->
  <RequestBody
    v-if="requestBody"
    :breadcrumb="breadcrumb ? [...breadcrumb, 'body'] : undefined"
    :eventBus="eventBus"
    :options="options"
    :requestBody="requestBody">
    <template #title>Body</template>
  </RequestBody>
</template>
