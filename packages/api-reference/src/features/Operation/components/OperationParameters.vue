<script setup lang="ts">
import { shouldIgnoreEntity } from '@scalar/oas-utils/helpers'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type {
  ParameterObject,
  ReferenceType,
  RequestBodyObject,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { computed } from 'vue'

import type { OperationProps } from '@/features/Operation/Operation.vue'

import ParameterList from './ParameterList.vue'
import RequestBody from './RequestBody.vue'

const { parameters = [], requestBody } = defineProps<{
  breadcrumb?: string[]
  parameters?: ReferenceType<ParameterObject>[]
  requestBody?: RequestBodyObject | undefined
  eventBus: WorkspaceEventBus | null
  options: Pick<
    OperationProps['options'],
    'orderRequiredPropertiesFirst' | 'orderSchemaPropertiesBy'
  >
}>()

/** Use a single loop to reduce parameters by type(in) */
const splitParameters = computed(() =>
  (parameters ?? []).reduce(
    (acc, p) => {
      const parameter = getResolvedRef(p)
      // Filter out ignored parameters
      if (!shouldIgnoreEntity(parameter)) {
        acc[parameter.in].push(parameter)
      }
      return acc
    },
    { cookie: [], header: [], path: [], query: [] } as Record<
      'cookie' | 'header' | 'path' | 'query',
      ParameterObject[]
    >,
  ),
)
</script>
<template>
  <!-- Path parameters-->
  <ParameterList
    :breadcrumb="breadcrumb ? [...breadcrumb, 'path'] : undefined"
    :eventBus="eventBus"
    :options="options"
    :parameters="splitParameters['path']">
    <template #title>Path Parameters</template>
  </ParameterList>

  <!-- Query parameters -->
  <ParameterList
    :breadcrumb="breadcrumb ? [...breadcrumb, 'query'] : undefined"
    :eventBus="eventBus"
    :options="options"
    :parameters="splitParameters['query']">
    <template #title>Query Parameters</template>
  </ParameterList>

  <!-- Headers -->
  <ParameterList
    :breadcrumb="breadcrumb ? [...breadcrumb, 'headers'] : undefined"
    :eventBus="eventBus"
    :options="options"
    :parameters="splitParameters['header']">
    <template #title>Headers</template>
  </ParameterList>

  <!-- Cookies -->
  <ParameterList
    :breadcrumb="breadcrumb ? [...breadcrumb, 'cookies'] : undefined"
    :eventBus="eventBus"
    :options="options"
    :parameters="splitParameters['cookie']">
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
