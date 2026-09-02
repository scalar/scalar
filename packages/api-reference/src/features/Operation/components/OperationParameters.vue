<script setup lang="ts">
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import { isHidden } from '@scalar/workspace-store/helpers/is-hidden'
import type {
  OpenApiDocument,
  ParameterObject,
  ReferenceType,
  RequestBodyObject,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { computed } from 'vue'

import { useLocalization } from '@/features/localization'
import { flattenDeepObjectQueryParameter } from '@/features/Operation/helpers/flatten-deep-object-query-parameter'
import type { OperationProps } from '@/features/Operation/Operation.vue'

import ParameterList from './ParameterList.vue'
import RequestBody from './RequestBody.vue'

const { parameters = [], requestBody } = defineProps<{
  breadcrumb?: string[]
  parameters?: ReferenceType<ParameterObject>[]
  requestBody?: RequestBodyObject | undefined
  eventBus: WorkspaceEventBus | null
  /** The document the operation belongs to, used to resolve schema references for display */
  document?: OpenApiDocument
  options: Pick<
    OperationProps['options'],
    | 'hideModels'
    | 'orderRequiredPropertiesFirst'
    | 'orderSchemaPropertiesBy'
    | 'expandAllSchemaProperties'
    | 'schemaLayout'
    | 'schemaKeyboardNav'
  >
}>()
const { translate } = useLocalization()

/** Thread the selected request body content type up to the layout */
const selectedContentType = defineModel<string>('selectedContentType')

type ParameterLocation = 'cookie' | 'header' | 'path' | 'query'

/** Use a single loop to reduce parameters by type(in) */
const splitParameters = computed(() =>
  (parameters ?? []).reduce(
    (acc, p) => {
      const parameter = getResolvedRef(p)
      // Filter out ignored parameters
      if (!isHidden(parameter)) {
        const flattenedParameters = flattenDeepObjectQueryParameter(parameter)
        flattenedParameters.forEach((flattenedParameter) => {
          acc[flattenedParameter.in as ParameterLocation].push(
            flattenedParameter,
          )
        })
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
    :collapsableItems="undefined"
    :document="document"
    :eventBus="eventBus"
    :options="options"
    :parameters="splitParameters['path']">
    <template #title>{{ translate('operation.pathParameters') }}</template>
  </ParameterList>

  <!-- Query parameters -->
  <ParameterList
    :breadcrumb="breadcrumb ? [...breadcrumb, 'query'] : undefined"
    :collapsableItems="undefined"
    :document="document"
    :eventBus="eventBus"
    :options="options"
    :parameters="splitParameters['query']">
    <template #title>{{ translate('operation.queryParameters') }}</template>
  </ParameterList>

  <!-- Headers -->
  <ParameterList
    :breadcrumb="breadcrumb ? [...breadcrumb, 'headers'] : undefined"
    :collapsableItems="undefined"
    :document="document"
    :eventBus="eventBus"
    :options="options"
    :parameters="splitParameters['header']">
    <template #title>{{ translate('operation.headers') }}</template>
  </ParameterList>

  <!-- Cookies -->
  <ParameterList
    :breadcrumb="breadcrumb ? [...breadcrumb, 'cookies'] : undefined"
    :collapsableItems="undefined"
    :document="document"
    :eventBus="eventBus"
    :options="options"
    :parameters="splitParameters['cookie']">
    <template #title>{{ translate('operation.cookies') }}</template>
  </ParameterList>

  <!-- Request body -->
  <RequestBody
    v-if="requestBody"
    v-model:selectedContentType="selectedContentType"
    :breadcrumb="breadcrumb ? [...breadcrumb, 'body'] : undefined"
    :document="document"
    :eventBus="eventBus"
    :options="options"
    :requestBody="requestBody">
    <template #title>{{ translate('operation.body') }}</template>
  </RequestBody>
</template>
